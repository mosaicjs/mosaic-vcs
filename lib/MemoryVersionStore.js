import Promise from 'promise';
import MemoryStore from './MemoryStore';

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

