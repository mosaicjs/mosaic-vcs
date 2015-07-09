import Promise from 'promise';
import SqliteStore from './SqliteStore';

export default class SqliteVersionStore extends SqliteStore {
    
    constructor(options){
        super(options);
    }
    
    /** Returns a list of table names */
    get t(){
        if (!this._tableSchema) {
            let prefix = this.options.tablePrefix || 'vc_';
            this._tableSchema = {
                blob : prefix + 'blob',
                history : prefix + 'history',
                path  : prefix + 'path',
                revs : prefix + 'revision',
                version : prefix + 'version',
                versionRevisions : prefix + 'version_revisions',
                versionParents : prefix + 'version_parents',
                contentView : prefix + 'content'
            };
        }
        return this._tableSchema;  
    }

    _runQueries(queries){
        let that = this;
        return that.writeTransaction(function(){
            let promise = Promise.resolve();
            for (let i=0, len = queries.length; i < len; i++) {
                let sql = queries[i];
                sql = sql.replace(/^\s+/gim, '    ');
                sql = sql.replace(/^\s+\)/gim, ')');
                promise = promise.then(this.run(sql).then(function(result){
                    return result.result;
                }));
            }
            return promise;
        });
    }
    
    onOpen(){
        let that = this;
        return that._runQueries(that._getCreateRequests())
        .then(function(){
            return that._runQueries(that._getCreateViews());
        })
    }
    
    // ------------------------------------------------------------------------
    
    _getPromise(indexName, key, method){
        let that = this;
        let index = that[indexName] = that[indexName] || {};
        let promise = index[key];
        if (!promise) {
            promise = Promise.resolve().then(function(){
                return method();
            }).then(function(result){
                delete index[key];
                return result;
            }, function(err) {
                delete index[key];
                throw err;
            });
        }
        return promise;
    }
    
    /**
     * Stores a blob object.
     * 
     * @param options.content
     *            the content of the blob object
     */
    storeBlob(options) {
        let that = this;
        let hash = options.hash;
        return that.writeTransaction(function(){
            let content = options.content;
            if (!content)
                throw new Error('Content is not defined');
            return that.get(
                `SELECT blobId, length, hash FROM ${that.t.blob} WHERE hash = $hash`,
                { $hash: hash }
            ).then(function(result){
                return result.result;
            }).then(function(blobInfo){
                if (blobInfo) return blobInfo;
                return that.run(
                    `INSERT INTO ${that.t.blob}(length, hash, content) 
                    VALUES($length, $hash, $content)`, {
                        $length: content.length,
                        $hash: options.hash,
                        $content: content
                    }).then(function(result){
                        return that.loadBlob({ blobId: result.lastID });
                    });
            });
        });
    }
     
    /**
     * Loads a blob object by its identifier.
     * 
     * @param options.blobId
     *            the identifier of the content blob object
     */
    loadBlob(options) {
        let that = this;
        return that.readTransaction(function(){
            return that.get(
                `SELECT blobId, length, hash, content 
                FROM ${that.t.blob}
                WHERE blobId = $blobId`,
                { $blobId: options.blobId }).then(function(result){
                    return result.result;
                });
        });
    }
    
    /**
     * Removes a blob object by its identifier.
     */
    deleteBlob(options) {
        let that = this;
        return that.writeTransaction(function(){
            if (!options.blobId)
                return ;
            return that.run(
                `DELETE FROM ${that.t.blob} WHERE blobId = $blobId`,
                { $blobId: options.blobId });
        }).then(function(result){
        });
    }
    
    // ------------------------------------------------------------------------

    /**
     * Stores paths and returns an object with paths and the corresponding
     * internal identifiers. If a path was not defined then it is automatically
     * added and a new identifier is generated. For already registered paths
     * their existing Id is returned.
     * 
     * @param options.paths
     *            a list of paths
     * @return an object containing paths as keys with the corresponding
     *         internal identifiers
     */
    storePaths(options){
        let that = this;
        return that.writeTransaction(function(){
            return that.loadPaths(options).then(function(mapping){
                let paths = options.paths || [];
                let index = {};
                return Promise.all(paths.map(function(path) {
                    let pathId = mapping[path];
                    if (pathId){
                        index[path] = pathId;
                        return Promise.resolve();
                    } else {
                        return that.run(
                            `INSERT INTO ${that.t.path}(path) VALUES ($path)`,
                            { $path: path }
                        ).then(function(result){
                            index[path] = result.lastID;
                        });    
                    }
                })).then(function(){
                    return index;
                });
            });
        });
    }

    /**
     * Loads identifiers of the specified paths.
     * 
     * @param options.paths
     *            a list of paths
     * @return an object containing paths as keys with the corresponding
     *         internal identifiers
     */
    loadPaths(options){
        let that = this;
        return that.readTransaction(function(){
            let paths, sql;
            if (options.paths) {
                sql = `SELECT * FROM ${that.t.path} WHERE path=$path`;
                paths = options.paths;
            } else {
                sql = `SELECT * FROM ${that.t.path} WHERE pathId=$path`;
                paths = options.pathIds || [];
            }
            if (!paths.length)
                return [];
            return Promise.all(paths.map(function(path){
                return that.get(sql,{ $path: path }).then(function(result){
                    return result.result;
                });
            }));
        }).then(function(list){
            let index = {};
            list.forEach(function(item){
                if (item) {
                    index[item.path] = item.pathId; 
                }
            })
            return index;
        });
    }
    
    // ------------------------------------------------------------------------
    
    /**
     * Stores information about a new resource revision. This method should be
     * called after storing the basic version of the file content and a diff
     * patch applied to this basic version. So many revisions can use the same
     * content by applying to it their own diff patch. Diff patch is also stored
     * as a blob object.
     * 
     * @param options.length
     *            a full length of the content for the stored content
     * @param options.hash
     *            an SHA-1 hash of the content of this revision
     * @param options.contentId
     *            an internal identifier of the basic content blob for this
     *            revision
     * @param options.diffId
     *            an internal identifier of the diff blob
     * @return an object containing the same information as the options plus the
     *         internal identifier of this revision
     */
    storeRevisionInfo(options){
        let that = this;
        return that.writeTransaction(function(){
            return that.loadRevisionInfoByHash(options).then(function(info){
                if (info) {
                    if (info.length !== options.length) {
                        throw new Error('' + 
                            'There is already a revision in the DB'  + 
                            'with such a hash, but the length of the content ' +
                            'is different. ' + 
                            'sha-1=' + info.hash + '; ' + 
                            'length=' + options.length + ' ' +
                            'expected_length=' + info.length + ' ');
                    }
                    return info;
                }
                return that.run(
                    `INSERT INTO ${that.t.revs}(length, hash, contentId, diffId)
                     VALUES ($length, $hash, $contentId, $diffId)`, {
                     $length: options.length,
                     $hash: options.hash,
                     $contentId: options.contentId,
                     $diffId: options.diffId
                 }).then(function(result){
                     return {
                         revisionId: result.lastID,
                         length: options.length,
                         hash: options.hash,
                         contentId: options.contentId,
                         diffId: options.diffId
                     };
                 });
            });
        });
    }

    /**
     * Loads information about a revision using its internal identifier
     * 
     * @param options.revisionId
     *            revision identifier
     */
    loadRevisionInfo(options){
        let that = this;
        return that.readTransaction(function(){
            return that.get(
                `SELECT * FROM ${that.t.revs} WHERE revisionId=$revisionId`, {
                 $revisionId: options.revisionId
             }).then(function(result){
                 return result.result;
             });
        });
    }
    
    /**
     * Loads information about a revision using content hash
     * 
     * @param options.hash
     *            content hash
     */
    loadRevisionInfoByHash(options){
        let that = this;
        return that.readTransaction(function(){
            return that.get(
                `SELECT * FROM ${that.t.revs} WHERE hash=$hash`, {
                 $hash: options.hash
             }).then(function(result){
                 return result.result;
             });
        });
    }
    // ------------------------------------------------------------------------
    
    /**
     * Creates a new repository version.
     * 
     * @param options.versionId
     *            version identifier; if it is already defined then this method
     *            updates already existing version
     * @param options.stamp
     *            timestamp (in milliseconds) of this version
     * @param options.iid
     *            identier of a blob object containing meta-information about
     *            this version
     * @return an object containing the same fields as the options parameters +
     *         'versionId' - the version internal identifier
     */
    storeVersion(options){
        let that = this;
        return that.writeTransaction(function(){
            let versionId = options.versionId;
            let promise = !!versionId ? that.loadVersion({versionId}) : Promise.resolve();
            return promise.then(function(info){
                info = info || {};
                info.stamp = options.stamp || info.stamp || new Date().getTime();
                info.iid = options.iid || info.iid || 0;
                if (!info.versionId){
                    return that.run(
                        `INSERT INTO ${that.t.version}(stamp, iid)
                         VALUES ($stamp, $iid)`, {
                         $stamp: info.stamp,
                         $iid: info.iid
                     }).then(function(result){
                         info.versionId = result.lastID;
                         return info;
                     });
                } else {
                    return that.run(
                        `UPDATE ${that.t.version} SET stamp=$stamp, iid=$iid 
                         WHERE versionId=$versionId`, {
                         $versionId : info.versionId,
                         $stamp: info.stamp,
                         $iid: info.iid
                     }).then(function(result){
                         return info;
                     });
                }
            });
        });
    }
    
    /**
     * Loads a repository version by its identifier.
     * 
     * @param options.versionId
     *            version identifier
     * @return version object containing the following fields a) versionId - version
     *         identifier b) stamp - timestamp of this version c) iid -
     *         identifier of the information blob containing meta-information
     *         about this version
     */
    loadVersion(options){
        let that = this;
        return that.readTransaction(function(){
            return that.get(
                `SELECT * FROM ${that.t.version} WHERE versionId=$versionId`, {
                 $versionId: options.versionId
             }).then(function(result){
                 return result.result;
             });
        });
    }
    
    // ------------------------------------------------------------------------

    /**
     * Creates a new resource revisions associated to the specified version.
     * 
     * @param options.versionId
     *            version identifier
     * @param options.mapping
     *            an object containing mapping of path identifiers to the
     *            corresponding revision identifiers
     * @param options.replace
     *            if this flag is <code>true</code> then all already defined
     *            paths are removed from this version and are replaced by the
     *            specified resource revisions; otherwise new resources are
     *            added to the version
     * @return a full mapping of path identifiers to the corresponding revision
     *         identifiers
     */
    storeVersionRevisions(options){
        let that = this;
        return that.writeTransaction(function(){
            let versionId = options.versionId;
            let mapping = options.mapping;
            let pathIdList = Object.keys(mapping);
            let where = options.replace ? '' : ` AND pathId IN (${pathIdList.join(', ')})`;
            return that.run(
                `DELETE FROM ${that.t.versionRevisions} WHERE versionId=$versionId ${where}`, {
                $versionId: versionId
            }).then(function(){
                return Promise.all(pathIdList.map(function(pathId){
                    let revisionId = mapping[pathId];
                    return that.run(
                        `INSERT INTO ${that.t.versionRevisions}(versionId, pathId, revisionId)
                         VALUES ($versionId, $pathId, $revisionId)`, {
                        $versionId: versionId,
                        $pathId: pathId,
                        $revisionId: revisionId
                    });
                }));
            }).then(function(){
                return that.loadVersionRevisions({versionId});
            });
        });
    }
    
    /**
     * Loads mapping of path identifiers to the corresponding revisions.
     * 
     * @param options.versionId
     *            version identifier
     * @return object containing path identifiers with the corresponding
     *         revision identifiers
     */
    loadVersionRevisions(options){
        let that = this;
        return that.readTransaction(function(){
            let versionId = options.versionId;
            return that.all(
                `SELECT * FROM ${that.t.versionRevisions} WHERE versionId=$versionId`, {
                $versionId: versionId
            }).then(function(result){
                let list = result.result;
                let index = {};
                list.forEach(function(obj){
                    index[obj.pathId] = obj.revisionId;
                });
                return index;
            });
        });
    }

 // ------------------------------------------------------------------------

    /**
     * Sets version parents.
     * 
     * @param options.versionId
     *            version identifier
     * @param options.parentIds
     *            a list of parent version identifiers
     */
    storeVersionParents(options){
        let that = this;
        return that.writeTransaction(function(){
            let versionId = options.versionId;
            if (!versionId) throw new Error('Version id is not defined');
            let parentIds = options.parentIds || [];
            return that.run(
                `DELETE FROM ${that.t.versionParents} WHERE versionId=$versionId`, {
                $versionId: versionId
            }).then(function(){
                return Promise.all(parentIds.map(function(parentId){
                    return that.run(
                            `INSERT INTO ${that.t.versionParents}(versionId,parentId)
                             VALUES($versionId, $parentId)`, {
                             $versionId:versionId,
                             $parentId: parentId
                        });
                }));
            }).then(function(){
                return that.loadVersionParents({versionId});
            });
        });
    }
    
    /**
     * Loads version parents
     * 
     * @param options.versionId
     *            version identifier
     * @return a list of identifiers of parent versions
     */
    loadVersionParents(options){
        let that = this;
        return that.readTransaction(function(){
            let versionId = options.versionId;
            if (!versionId) throw new Error('Version id is not defined');
            return that.all(
                `SELECT * FROM ${that.t.versionParents} WHERE versionId=$versionId`, {
                $versionId: versionId
            }).then(function(info){
                let list = info.result;
                let result = [];
                list.forEach(function(obj){
                   result.push(obj.parentId); 
                });
                return result;
            });
        });
    }

    /**
     * Loads version children
     * 
     * @param options.versionId
     *            version identifier
     * @return a list of children versions
     */
    loadVersionChildren(options){
        let that = this;
        return that.readTransaction(function(){
            let versionId = options.versionId;
            if (!versionId) throw new Error('Version id is not defined');
            return that.all(
                `SELECT * FROM ${that.t.versionParents} WHERE parentId=$versionId`, {
                $versionId: versionId
            }).then(function(info){
                let list = info.result;
                let result = [];
                list.forEach(function(obj){
                   result.push(obj.versionId); 
                });
                return result;
            });
        });
    }
    
    // ------------------------------------------------------------------------
        _getCreateRequests(){
          let that = this;
          let selectQuery = `
              SELECT * FROM ${that.t.path}
              WHERE path LIKE '$path%' AND 
                  path NOT LIKE '$path%/%'
          `; 
          return [
           // Blob content
           // * blobId - blob identifier
           // * length - length of the content
           // * hash - a sha-1 hash of the content
           // * content - a blob buffer with the content
           `CREATE TABLE IF NOT EXISTS ${that.t.blob} (
                   blobId INTEGER PRIMARY KEY,
                   length INTEGER,
                   hash TEXT UNIQUE NOT NULL,
                   content BLOB, 
                   CHECK( length(hash)==40 AND blobId>0 ) 
           )`,
           
           // Paths paths
           // * pathId - path identifier
           // * path - a full path to the content
           `CREATE TABLE IF NOT EXISTS ${that.t.path} (
                  pathId INTEGER PRIMARY KEY,
                  path TEXT UNIQUE
           )`,

           // Individual resource revisions
           // * revisionId - revision identifier
           // * length - content length
           // * hash - sha-1 hash of the final content
           // * contentId - identifier of the base blob version
           // * diffId - identifier of the diff patch to apply to the content
           `CREATE TABLE IF NOT EXISTS ${that.t.revs} (
                   revisionId INTEGER PRIMARY KEY,
                   length INTEGER,
                   hash TEXT UNIQUE NOT NULL,
                   contentId INTEGER NOT NULL,
                   diffId INTEGER,
                   CHECK( length(hash)==40 AND revisionId > 0 AND contentId > 0 ),
                   FOREIGN KEY(contentId) REFERENCES ${that.t.blob}(blobId),
                   FOREIGN KEY(diffId) REFERENCES ${that.t.blob}(blobId)
            )`,
            
            // Information about individual repository versions
            // * versionId - version id
            // * stamp - timestamp (in milliseconds)
            // * iid - reference to the information object in the blob
            // table; its hash is used as a 'seal' for the version
            `CREATE TABLE IF NOT EXISTS ${that.t.version} (
                    versionId INTEGER PRIMARY KEY,
                    stamp DATETIME,
                    iid INTEGER,
                    CHECK( versionId > 0 ),
                    FOREIGN KEY(iid) REFERENCES ${that.t.blob}(blobId)
            )`,
            
            // Puts together versions, paths and their revisions
            // * versionId - version identifier
            // * pathId - path identifier
            // * revisionId - revision identifier
            `CREATE TABLE IF NOT EXISTS ${that.t.versionRevisions} (
                    versionId INTEGER NOT NULL,
                    pathId INTEGER NOT NULL,
                    revisionId INTEGER NOT NULL,
                    FOREIGN KEY(versionId) REFERENCES ${that.t.version}(versionId),
                    FOREIGN KEY(pathId) REFERENCES ${that.t.path}(pathId),
                    FOREIGN KEY(revisionId) REFERENCES ${that.t.revs}(revisionId),
                    PRIMARY KEY(versionId, pathId)
             )`,
             
             // Parent-children relations between individual versions
             // * versionId - version identifier
             // * parentId - identifier of the parent version
             `CREATE TABLE IF NOT EXISTS ${that.t.versionParents} (
                     versionId INTEGER,
                     parentId INTEGER,
                     FOREIGN KEY(versionId) REFERENCES ${that.t.version}(versionId),
                     FOREIGN KEY(parentId) REFERENCES ${that.t.version}(versionId),
                     PRIMARY KEY(versionId, parentId)
             )`
          ];
    }
        
    _getCreateViews() {
        let that = this;
        return [
        // A content view
        `CREATE VIEW IF NOT EXISTS ${that.t.contentView} AS
         SELECT 
            N.versionId AS versionId,
            N.path AS path,
            N.length AS length,
            N.hash AS hash,
            C.length AS contentLength,
            C.hash AS contentHash,
            C.content AS content,
            D.length AS diffLength,
            D.hash AS diffHash,
            D.content AS diff
        FROM (
        SELECT 
            V.versionId,
            P.path,
            R.revisionId,
            R.length,
            R.hash,
            R.contentId,
            R.diffId
        FROM 
            ${that.t.versionRevisions} AS V,
            ${that.t.path} AS P,
            ${that.t.revs} AS R
        WHERE 
            V.pathId = P.pathId AND
            V.revisionId = R.revisionId
        ) AS N
        LEFT JOIN ${that.t.blob} AS C ON (C.blobId = N.contentId)
        LEFT JOIN ${that.t.blob} AS D ON (D.blobId = N.diffId)
        ORDER BY N.versionId, N.path`
        ];
    }
}