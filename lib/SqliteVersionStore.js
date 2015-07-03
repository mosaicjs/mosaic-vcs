import Promise from 'promise';
import SqliteStore from './SqliteStore';
import Digest from './Digest';

export default class SqliteVersionStore extends SqliteStore {
    
    constructor(options){
        super(options);
    }
    
    onOpen(){
        let queries = this._getCreateRequests();
        let promise = Promise.resolve();
        for (let i=0, len = queries.length; i < len; i++) {
            let sql = queries[i];
            promise = promise.then(this.run(sql));
        }
        return promise;
    }
    
    // ------------------------------------------------------------------------

    /**
     * Returns a map of all mime types. Keys are mime types and values are the
     * corresponding identifiers.
     */
    loadMimeTypes() {
        let that = this;
        return that.readTransaction(function(){
            return that.all(`SELECT * FROM mimes`).then(function(list){
                let result = {};
                list.forEach(function(rec){
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
        return that.loadMimeTypes().then(function(types){
            return that.writeTransaction(function(){
                let newTypes = options.types || [];
                return Promise.all(newTypes.map(function(type){
                    if (type in types) {
                        return Promise.resolve();
                    }
                    return that.run(
                            `INSERT INTO mimes(type) VALUES( ?1 )`, 
                            type);
                }));
            }).then(function(){
                return that.loadMimeTypes();
                // return this.run(`SELECT last_insert_rowid()`);
            });
        });
    }

    // ------------------------------------------------------------------------
    
    /**
     * Stores a blob object.
     * @param options.content the content of the blob object
     */
    storeBlob(options) {
        let that = this;
        return that.writeTransaction(function(){
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
                }).then(function(){
                    return that._loadBlobInfoByHash(hash);
                });
            });
        });
    }
    
    _loadBlobInfoByHash(hash) {
        return this.get(
            `SELECT bid AS id, length, hash FROM blob WHERE hash = $hash`,
            { $hash: hash });
    }
    
    /**
     * Loads a blob object by its identifier.
     * @param options.content the content of the blob object
     */
    loadBlob(options) {
        let that = this;
        return that.readTransaction(function(){
            return that.get(
                `SELECT bid AS id, length, hash, content FROM blob WHERE bid = $id`,
                { $id: options.id });
        });
    }
    
    /**
     * Removes a blob object by its identifier.
     */
    deleteBlob(options) {
        let that = this;
        return that.writeTransaction(function(){
            if (!options.id)
                return ;
            return that.run(
                `DELETE FROM blob WHERE bid = $id`,
                { $id: options.id });
        }).then(function(result){
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
                      fnid INTEGER PRIMARY KEY,
                      name TEXT UNIQUE
               )`,
               
               // Individual file revisions
               `CREATE TABLE IF NOT EXISTS revs (
                       rid INTEGER PRIMARY KEY,
                       fnid INTEGER,
                       mid INTEGER,
                       length INTEGER,
                       hash TEXT NOT NULL,
                       content INTEGER,
                       diff INTEGER,
                       CHECK( length(hash)==40 AND rid>0 ),
                       FOREIGN KEY(mid) REFERENCES mimes(mid),
                       FOREIGN KEY(fnid) REFERENCES filename(fnid),
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
                        fnid INTEGER,
                        rev INTEGER,
                        FOREIGN KEY(vid) REFERENCES versioninfo(vid),
                        FOREIGN KEY(fnid) REFERENCES filename(fnid),
                        FOREIGN KEY(rev) REFERENCES revs(rid),
                        PRIMARY KEY(vid, fnid)
                 )`
          ];
    }

}