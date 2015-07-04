import Promise from 'promise';
import SqliteStore from './SqliteStore';
import Digest from './Digest';

export default class SqliteVersionStore extends SqliteStore {
    
    constructor(options){
        super(options);
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
            return that.all(`SELECT * FROM mimes`).then(function(info){
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
                            `INSERT INTO mimes(type) VALUES( ?1 )`, 
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
            let hash = Digest.digest(content);
            return that._loadBlobInfoByHash(hash).then(function(blobInfo){
                if (blobInfo) return blobInfo;
                return that.run(
                    `INSERT INTO blob(length, hash, content) 
                     VALUES($length, $hash, $content)`, {
                    $length: content.length,
                    $hash: hash,
                    $content: content
                }).then(function(result){
                    return that._loadBlobInfoByHash(hash);
                });
            });
        });
    }
    
    _loadBlobInfoByHash(hash) {
        return this.get(
            `SELECT bid AS id, length, hash FROM blob WHERE hash = $hash`,
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
                `SELECT bid AS id, length, hash, content FROM blob WHERE bid = $id`,
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
                `DELETE FROM blob WHERE bid = $id`,
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
                    `INSERT INTO filename(name) VALUES ($path)`,
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
                    `SELECT * FROM filename WHERE name=$path`,
                    { $path: path }
                ).then(function(result){
                    return result.result;
                });
            }));
        }).then(function(list){
            let index = {};
            list.forEach(function(item){
                index[item.name] = item.nid; 
            })
            return index;
        });
    }
    
    // ------------------------------------------------------------------------
    
    /**
     * Stores information about a new file revision. This method should be
     * called after storing the basic version of the file content and a diff
     * patch applied to this basic version. So many revisions can use the same
     * content by applying to it their own diff patch. Diff patch is also stored
     * as a blob object.
     * 
     * @param options.nid
     *            an internal file identifier (see the 'loadPaths' method)
     * @param options.mid
     *            a mime type identifier (see the 'loadMimeTypes' method)
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
                `INSERT INTO revs(nid, mid, length, hash, stamp, content, diff)
                 VALUES ($nid, $mid, $length, $hash, $stamp, $content, $diff)`, {
                 $nid: options.nid,
                 $mid: options.mid,
                 $length: options.length,
                 $hash: options.hash,
                 $stamp: options.stamp,
                 $content: options.content,
                 $diff: options.diff
             }).then(function(result){
                 return {
                     rid: result.lastID,
                     nid: options.nid,
                     mid: options.mid,
                     length: options.length,
                     hash: options.hash,
                     stamp: options.stamp || new Date().getTime(),
                     content: options.content,
                     diff: options.diff
                 };
             });
        });
    }

    /**
     * Loads information about a revision using its internal identifier.
     * 
     * @param options.rid
     *            revision identifier
     */
    loadRevisionInfo(options){
        let that = this;
        return Promise.resolve().then(function(){
            return that.get(
                `SELECT * FROM revs WHERE rid=$rid`, {
                 $rid: options.rid
             }).then(function(result){
                 return result.result;
             });
        });
    }
    
    // ------------------------------------------------------------------------
    
    
    _getCreateRequests(){
          let selectQuery = `
              SELECT * FROM filename
              WHERE name LIKE '$path%' AND 
                  name NOT LIKE '$path%/%'
          `; 
          return [
              `CREATE TABLE IF NOT EXISTS mimes (
                      mid INTEGER PRIMARY KEY,
                      type TEXT NOT NULL
               )`,
               
               // Blob content
               `CREATE TABLE IF NOT EXISTS blob (
                       bid INTEGER PRIMARY KEY,
                       length INTEGER,
                       hash TEXT UNIQUE NOT NULL,
                       content BLOB, 
                       CHECK( length(hash)==40 AND bid>0 ) 
               )`,
               
               // Filenames (full paths)
               `CREATE TABLE IF NOT EXISTS filename(
                      nid INTEGER PRIMARY KEY,
                      name TEXT UNIQUE
               )`,
               
               // Individual file revisions
               `CREATE TABLE IF NOT EXISTS revs (
                       rid INTEGER PRIMARY KEY,
                       nid INTEGER,
                       mid INTEGER,
                       length INTEGER,
                       hash TEXT NOT NULL,
                       content INTEGER,
                       diff INTEGER,
                       stamp NUMERIC NOT NULL,
                       CHECK( length(hash)==40 AND rid>0 ),
                       FOREIGN KEY(mid) REFERENCES mimes(mid),
                       FOREIGN KEY(nid) REFERENCES filename(nid),
                       FOREIGN KEY(content) REFERENCES blob(bid),
                       FOREIGN KEY(diff) REFERENCES blob(bid)
                )`,
                
                // Information about versions (parent, time, comment, owner...)
                `CREATE TABLE IF NOT EXISTS versioninfo (
                        vid INTEGER PRIMARY KEY,
                        parent INTEGER,
                        hash TEXT NOT NULL,
                        comment TEXT,
                        stamp DATETIME,
                        CHECK(length(hash)==40 )
                )`,
                
                // Puts together versions, files and their revisions
                `CREATE TABLE IF NOT EXISTS version (
                        vid INTEGER,
                        nid INTEGER,
                        rev INTEGER,
                        FOREIGN KEY(vid) REFERENCES versioninfo(vid),
                        FOREIGN KEY(nid) REFERENCES filename(nid),
                        FOREIGN KEY(rev) REFERENCES revs(rid),
                        PRIMARY KEY(vid, nid)
                 )`
          ];
    }

}