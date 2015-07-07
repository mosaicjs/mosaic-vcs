import Promise from 'promise';
import VersionControlEntity from './VersionControlEntity';

/**
 * An individual blob object giving access to the content.
 */
export default class Blob extends VersionControlEntity {
        
    /**
     * Returns metadata about this revision
     */ 
    loadMetadata(){
        if (!this._meta) {
            this._meta = this.store.loadRevisionInfo({rid:this.options.id});
        }
        return this._meta;
    }
    
    /**
     * Loads the content of this resource revision. The returned value is a
     * Buffer instance.
     */
    loadContent(){
        if (!this._content){
            this._content = this.loadMetadata().then(function(meta){
                // TODO: load the content and diff blobs
                // TODO: apply diff to the content
                // TODO: check that the length and hashes are valid
                // TODO: return the final block object
            });
        }
        return this._content;
    }
    
    /**
     * Load the content of this object a JSON object.
     */
    loadJSON(){
        return this.loadString(result).then(function(str){
            return JSON.parse(str);
        });
    }
    
    /**
     * Load the content of this object a UTF-8 string.
     */
    loadString(){
        return this.loadContent(result).then(function(buf){
            return buf.toString('UTF-8');
        });
    }
    
    /**
     * Creates and returns a new Blob instance based on this one.
     * 
     * @param options.content
     *            a new revision content to store
     */
    newBlob(options){
        return Promise.all([this.loadMetadata(), this.loadContent()]
        .then(function(info){
            let meta = info[0];
            let content = info[1];
            let newContent = options.content || new Buffer([]);
            // TODO: make a diff between new content and this one
            // TODO: store the full content if the difference is too important
            // TODO: store the diff content if the difference is not important
            // TODO: create and return a Revision instance with the 'rid'
            let rid = 0;
            return Blob({store: this.store, rid: 0});
        }.bind(this));
    }
}
