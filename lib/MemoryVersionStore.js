import Promise from 'promise';
import MemoryStore from './MemoryStore';
import Digest from './Digest';

export default class MemoryVersionStore extends MemoryStore {
        
    /**
     * Returns a map of all mime types. Keys are indexes and values are the
     * corresponding mime types.
     */
    loadMimeTypes() {
        let that = this;
        return Promise.resolve().then(function(){
            that._mimes = that._mimes || {};
            return copy(that._mimes);
        });
    }
    
    /**
     * Adds new mime types and returns the full index of mime types.
     * 
     * @param options.types -
     *            a list of mime types to add
     */
    storeMimeTypes(options){
        let that = this;
        return Promise.resolve().then(function(){
            that._mimes = that._mimes || {};
            let types = options.types || [];
            types.forEach(function(type){
                if (!(type in that._mimes)) {
                    that._mimes[type] = that._newId();
                }
            });
            return copy(that._mimes);
        });
    }
    
    // ------------------------------------------------------------------------
    
    /**
     * Stores a blob object.
     * @param options.content the content of the blob object
     */
    storeBlob(options) {
        let that = this;
        return Promise.resolve().then(function(){
            let content = options.content || new Buffer('', 'UTF-8');
            let hash = Digest.digest(content);
            let blobs = that._blobs = that._blobs || {};
            let blobIds = that._blobIds = that._blobIds || {};
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
     * @param options.content the content of the blob object
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

