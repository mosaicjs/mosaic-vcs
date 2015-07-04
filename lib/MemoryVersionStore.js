import Promise from 'promise';
import MemoryStore from './MemoryStore';

export default class MemoryVersionStore extends MemoryStore {
        
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
            let blobs = that._blobs = that._blobs || {};
            let blobIds = that._blobIds = that._blobIds || {};
            let hash = options.hash;
            let id = blobIds[hash];
            let blob;
            if (id) {
                blob = blobs[id];
            } else {
                id = that._newId();
                blobIds[hash] = id;
                blob = blobs[id] = {
                    id : id,
                    content : content,
                    hash : hash,
                    length : content.length 
                };
            }
            let info = {
                id : blob.id,
                hash : blob.hash,
                length: blob.length
            };
            return info;
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
            let blobs = that._blobs = that._blobs || {};
            let blob = blobs[options.id];
            return blob;
        });
    }
    
    /**
     * Removes a blob object by its identifier.
     */
    deleteBlob(options) {
        let that = this;
        return Promise.resolve().then(function(){
            let blobs = that._blobs = that._blobs || {};
            let blobIds = that._blobIds = that._blobIds || {};
            let blob = blobs[options.id];
            if (blob) {
                delete blobs[blob.id];
                delete blobIds[blob.hash];
            }
        });
    }
    
    // ------------------------------------------------------------------------
    
    storePaths(options){
        return this._getPaths(options, true);
    }

    loadPaths(options){
        return this._getPaths(options, false);
    }
    
    _getPaths(options, add) {
        let that = this;
        return Promise.resolve().then(function(){
            let pathsIndex = that._paths = that._paths || {};
            let result = {};
            let paths = options.paths || [];
            paths.forEach(function(path){
                let id = pathsIndex[path];
                if (!id && add){
                    id = pathsIndex[path] = that._newId();
                }
                result[path] = id;
            });
            return result;
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
            let revsIndex = that._revs = that._revs || {};
            let revsHashIndex = that._revsHashes = that._revsHashes || {};
            let info = revsHashIndex[options.hash];
            if (!info ) {
                info = {
                    rid: that._newId(),
                    length: options.length,
                    hash: options.hash,
                    content: options.content,
                    diff: options.diff
                };
                revsIndex[info.rid] = info;
                revsHashIndex[info.hash] = info;
            }
            return info;
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
            let revsIndex = that._revs = that._revs || {};
            let info = revsIndex[options.rid];
            return info;
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
            let revsHashIndex = that._revsHashes = that._revsHashes || {};
            let info = revsHashIndex[options.hash];
            return info;
        });
    }

    // ------------------------------------------------------------------------
    // Repository version
    
    /**
     * Creates a new repository version.
     * 
     * @param options.vid
     *            version identifier; if it is already defined then this method
     *            updates already existing version
     * @param options.stamp
     *            timestamp (in milliseconds) of this version
     * @param options.iid
     *            identier of a blob object containing meta-information about
     *            this version
     * @return an object containing the same fields as the options parameters +
     *         'vid' - the version internal identifier
     */
    storeVersion(options){
        let that = this;
        return Promise.resolve().then(function(){
            let versions = that._versions = that._versions || {};
            let info;
            if (options.vid){
                info = versions[options.vid];
            }
            info = info || {};
            let vid = info.vid || that._newId();
            info = versions[vid] = {
                vid: vid,
                stamp : options.stamp || info.stamp || new Date().getTime(),
                iid : options.iid || info.iid || undefined
            };
            return info;
        });
    }
    
    /**
     * Loads a repository version by its identifier.
     * 
     * @param options.vid
     *            version identifier
     * @return version object containing the following fields a) vid - version
     *         identifier b) stamp - timestamp of this version c) iid -
     *         identifier of the information blob containing meta-information
     *         about this version
     */
    loadVersion(options){
        let that = this;
        return Promise.resolve().then(function(){
            let versions = that._versions = that._versions || {};
            let info = versions[options.vid];
            return info;
        });
    }

    // ------------------------------------------------------------------------
    
    _newId(){
        this._counter = (this._counter || 0) + 1;
        return this._counter;
    }

}

function copy(obj){
    if (!obj)
        return obj;
    return JSON.parse(JSON.stringify(obj));
}

