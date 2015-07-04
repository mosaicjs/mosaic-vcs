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
                mimes : prefix + 'mimes',
                blob : prefix + 'blob',
                path  : prefix + 'path',
                revs : prefix + 'revs',
                version : prefix + 'version',
                changeset : prefix + 'changeset'
            };
        }
        return this._tableSchema;  
    }
    
    onOpen(){
        let that = this;
        return that.writeTransaction(function(){
            let queries = this._getCreateRequests();
            let promise = Promise.resolve();
            for (let i=0, len = queries.length; i < len; i++) {
                let sql = queries[i];
                promise = promise.then(this.run(sql).then(function(result){
                    return result.result;
                }));
            }
            return promise;
        });
    }
    
    // ------------------------------------------------------------------------

    /**
     * Returns a map of all mime types. Keys are mime types and values are the
     * corresponding identifiers.
     */
    loadMimeTypes() {
        let that = this;
        return Promise.resolve().then(function(){
            return that.all(`SELECT * FROM ${that.t.mimes}`).then(function(info){
                let result = {};
                info.result.forEach(function(rec){
                   result[rec.type] = rec.mid; 
                });
                return result;
            });
        });
    }
    
    /**
     * Adds a new mime type (if it is not registered yet) and returns all mime
     * types.
     * 
     * @param options.type
     *            a mime type to store
     */
    storeMimeTypes(options){
        let that = this;
        return Promise.resolve().then(function(){
            return that.loadMimeTypes().then(function(types){
                let newTypes = options.types || [];
                let index = {};
                return Promise.all(newTypes.map(function(type){
                    let id = types[type];
                    if (id !== undefined) {
                        index[type] = id;
                        return Promise.resolve();
                    }
                    return that.run(
                            `INSERT INTO ${that.t.mimes}(type) VALUES( ?1 )`, 
                            type).then(function(result) {
                                index[type] = result.lastID;
                            });
                })).then(function(){
                    return index;
                });
            });
        });
    }

    // ------------------------------------------------------------------------
    
    /**
     * Stores a blob object.
     * 
     * @param options.content
     *            the content of the blob object
     */
    storeBlob(options) {
        let that = this;
        return Promise.resolve().then(function(){
            let content = options.content || new Buffer('', 'UTF-8');
            let hash = options.hash;
            return that._loadBlobInfoByHash(hash).then(function(blobInfo){
                if (blobInfo) return blobInfo;
                return that.run(
                    `INSERT INTO ${that.t.blob}(length, hash, content) 
                     VALUES($length, $hash, $content)`, {
                    $length: content.length,
                    $hash: options.hash,
                    $content: content
                }).then(function(result){
                    return that._loadBlobInfoByHash(hash);
                });
            });
        });
    }
    
    _loadBlobInfoByHash(hash) {
        let that = this;
        return this.get(
            `SELECT bid AS id, length, hash FROM ${that.t.blob} WHERE hash = $hash`,
            { $hash: hash }).then(function(result){
                return result.result;
            });
    }
    
    /**
     * Loads a blob object by its identifier.
     * 
     * @param options.content
     *            the content of the blob object
     */
    loadBlob(options) {
        let that = this;
        return Promise.resolve().then(function(){
            return that.get(
                `SELECT bid AS id, length, hash, content FROM ${that.t.blob} WHERE bid = $id`,
                { $id: options.id }).then(function(result){
                    return result.result;
                });
        });
    }
    
    /**
     * Removes a blob object by its identifier.
     */
    deleteBlob(options) {
        let that = this;
        return Promise.resolve().then(function(){
            if (!options.id)
                return ;
            return that.run(
                `DELETE FROM ${that.t.blob} WHERE bid = $id`,
                { $id: options.id });
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
        return Promise.resolve().then(function(){
            let paths = options.paths || [];
            let index = {};
            return Promise.all(paths.map(function(path) {
                return that.run(
                    `INSERT INTO ${that.t.path}(path) VALUES ($path)`,
                    { $path: path }
                ).then(function(result){
                    index[path] = result.lastID;
                });    
            })).then(function(){
                return index;
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
        return Promise.resolve().then(function(){
            let paths = options.paths || [];
            return Promise.all(paths.map(function(path){
                return that.get(
                    `SELECT * FROM ${that.t.path} WHERE path=$path`,
                    { $path: path }
                ).then(function(result){
                    return result.result;
                });
            }));
        }).then(function(list){
            let index = {};
            list.forEach(function(item){
                index[item.path] = item.pid; 
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
     * @param options.content
     *            an internal identifier of the basic content blob for this
     *            revision
     * @param options.diff
     *            an internal identifier of the diff blob
     * @return an object containing the same information as the options plus the
     *         internal identifier of this revision
     */
    storeRevisionInfo(options){
        let that = this;
        return Promise.resolve().then(function(){
            return that.run(
                `INSERT INTO ${that.t.revs}(length, hash, content, diff)
                 VALUES ($length, $hash, $content, $diff)`, {
                 $length: options.length,
                 $hash: options.hash,
                 $content: options.content,
                 $diff: options.diff
             }).then(function(result){
                 return {
                     rid: result.lastID,
                     length: options.length,
                     hash: options.hash,
                     content: options.content,
                     diff: options.diff
                 };
             });
        });
    }

    /**
     * Loads information about a revision using its internal identifier
     * 
     * @param options.rid
     *            revision identifier
     */
    loadRevisionInfo(options){
        let that = this;
        return Promise.resolve().then(function(){
            return that.get(
                `SELECT * FROM ${that.t.revs} WHERE rid=$rid`, {
                 $rid: options.rid
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
        return Promise.resolve().then(function(){
            return that.get(
                `SELECT * FROM ${that.t.revs} WHERE hash=$hash`, {
                 $hash: options.hash
             }).then(function(result){
                 return result.result;
             });
        });
    }
    // ------------------------------------------------------------------------
    
    load
    
    // ------------------------------------------------------------------------

    _getCreateRequests(){
          let that = this;
          let selectQuery = `
              SELECT * FROM ${that.t.path}
              WHERE path LIKE '$path%' AND 
                  path NOT LIKE '$path%/%'
          `; 
          return [

               // Mime types 
               // * mid - mime type identifier
               // * type - mime type string 
               `CREATE TABLE IF NOT EXISTS ${that.t.mimes} (
                      mid INTEGER PRIMARY KEY,
                      type TEXT NOT NULL
               )`,
               
               // Blob content
               // * bid - blob identifier
               // * length - length of the content
               // * hash - a sha-1 hash of the content
               // * content - a blob buffer with the content
               `CREATE TABLE IF NOT EXISTS ${that.t.blob} (
                       bid INTEGER PRIMARY KEY,
                       length INTEGER,
                       hash TEXT UNIQUE NOT NULL,
                       content BLOB, 
                       CHECK( length(hash)==40 AND bid>0 ) 
               )`,
               
               // Paths paths
               // * pid - path identifier
               // * path - a full path to the content
               `CREATE TABLE IF NOT EXISTS ${that.t.path} (
                      pid INTEGER PRIMARY KEY,
                      path TEXT UNIQUE
               )`,

               // Individual resource revisions
               // * rid - revision identifier
               // * length - content length
               // * hash - sha-1 hash of the final content
               // * content - identifier of the base blob version
               // * diff - identifier of the diff patch to apply to the content
               `CREATE TABLE IF NOT EXISTS ${that.t.revs} (
                       rid INTEGER PRIMARY KEY,
                       length INTEGER,
                       hash TEXT UNIQUE NOT NULL,
                       content INTEGER NOT NULL,
                       diff INTEGER,
                       CHECK( length(hash)==40 AND rid > 0 AND content > 0 ),
                       FOREIGN KEY(content) REFERENCES ${that.t.blob}(bid),
                       FOREIGN KEY(diff) REFERENCES ${that.t.blob}(bid)
                )`,
                
                // Information about individual repository versions
                // * vid - version id
                // * stamp - timestamp (in milliseconds)
                // * iid - reference to the information object in the blob
                // table; its hash is used as a 'seal' for the version
                `CREATE TABLE IF NOT EXISTS ${that.t.version} (
                        vid INTEGER PRIMARY KEY,
                        stamp DATETIME,
                        iid INTEGER,
                        CHECK( vid > 0 ),
                        FOREIGN KEY(iid) REFERENCES ${that.t.blob}(bid)
                )`,
                
                // Puts together versions, paths and their revisions
                // * vid - version identifier
                // * pid - path identifier
                // * rid - revision identifier
                `CREATE TABLE IF NOT EXISTS ${that.t.changeset} (
                        vid INTEGER NOT NULL,
                        pid INTEGER NOT NULL,
                        rid INTEGER NOT NULL,
                        FOREIGN KEY(vid) REFERENCES ${that.t.version}(vid),
                        FOREIGN KEY(pid) REFERENCES ${that.t.path}(pid),
                        FOREIGN KEY(rid) REFERENCES ${that.t.revs}(rid),
                        PRIMARY KEY(vid, pid)
                 )`,
                 
                 // History information - parent-children relations between
                    // individual versions
                 `CREATE TABLE IF NOT EXISTS ${that.t.history} (
                         vid INTEGER,
                         parent INTEGER,
                         FOREIGN KEY(vid) REFERENCES ${that.t.version}(vid),
                         FOREIGN KEY(parent) REFERENCES ${that.t.version}(vid),
                         PRIMARY KEY(vid, parent)
                 )`,
                 
                 
          ];
    }

}