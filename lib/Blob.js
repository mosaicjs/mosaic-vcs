import Promise from 'promise';
import VersionControlEntity from './VersionControlEntity';
import Digest from './utils/Digest'; 
import BinDelta from './utils/BinDelta';

const EMPTY_BUFFER = new Buffer([]);
const EMPTY_HASH = Digest.digest(EMPTY_BUFFER);

/**
 * An individual blob object giving access to the content.
 */
export default class Blob extends VersionControlEntity {
        
    /**
     * Returns metadata about this revision
     */ 
    loadMetadata(){
        if (!this._meta) {
            this._meta = this.store.loadRevisionInfo({rid:this.options.id})
            .then(function(meta){
                return meta || {
                    rid: 0,
                    length: 0,
                    hash: EMPTY_HASH,
                    content: 0,
                    diff: 0
                };
            });
        }
        return this._meta;
    }

    /**
     * Loads the content of this resource revision. The returned value is a
     * Buffer instance.
     */
    loadContent(){
        let that = this;
        if (!that._content){
            that._content = that.loadMetadata().then(function(meta){
                return Promise.all([
                    that.store.loadBlob({ id : meta.content }), 
                    that.store.loadBlob({ id : meta.diff }) 
                ]).then(function(list){
                    let base = list[0] || {};
                    if (!base.hash) {
                        return new Buffer([]);
                    }
                    let diff = list[1] || {};
                    let baseContent = base.content;
                    let diffContent = diff.content;
                    return that._applyDiff(baseContent, diffContent);
                }).then(function(buf){
                    let hash = Digest.digest(buf);
                    if (meta.hash !== hash) {
                        throw new Error('Bad SHA-1 hash of the content. ' + 
                                'Expected: "' + meta.hash + '". ' + 
                                'Real: "' + hash + '".');
                    }
                    return buf;
                });
            });
        }
        return that._content;
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
        let that = this;
        return that.store.writeTransaction(function(){
            return that.loadContent().then(function(oldContent){
                let newContent = options.content || new Buffer([]);
                // Build a diff
                let diff = that._buildDiff(oldContent, newContent);
                // Create a new revision
                let revisionInfo = {
                    length: newContent.length,
                    hash: Digest.digest(newContent),
                    content: 0, // Identifier of the base content
                    diff: 0 // Identifier of the diff
                };
                if (!!diff) {
                    // If a diff is defined then store the diff object
                    // and update the revisionInfo
                    return that.store.storeBlob({
                        content : diff,
                        hash : Digest.digest(diff)
                    }).then(function(diffBlobInfo){
                        revisionInfo.diff = diffBlobInfo.id;
                        return that.loadMetadata().then(function(oldMeta){
                            revisionInfo.content = oldMeta.content;
                            return revisionInfo;
                        });
                    });
                } else {
                    // Diff was not defined => store a new blob as is.
                    return that.store.storeBlob({
                        content: newContent,
                        hash : revisionInfo.hash
                    }).then(function(newContentBlobInfo){
                        revisionInfo.content = newContentBlobInfo.id;
                        return revisionInfo;
                    });
                }
            }).then(function(revisionInfo){
                return that.store.storeRevisionInfo(revisionInfo)
                .then(function(meta){
                    return that._newBlob(meta.rid);
                });
            })
        });
    }
    
    _buildDiff(oldContent, newContent){
        if (!oldContent || !oldContent.length || !newContent)
            return null;
        let diff = BinDelta.diff(oldContent, newContent);
        if (this._shouldStoreDiff(diff, oldContent.length)) {
            return diff;
        } else {
            return null;
        }
    }
    
    _applyDiff(content, diff){
        if (!diff) {
            return content;
        }
        try {
            return BinDelta.patch(content, diff);
        } catch (err) {
            console.log('ERROR!', err.stack, content, diff);
            throw err;
            return content;
        }
    }
    
    _newBlob(id){
        return new Blob({store : this.store, id : id});
    }

    /**
     * Returns <code>true</code> if the specified diff object should be
     * stored.
     */
    _shouldStoreDiff(diff, baseLen) {
        if (!diff)
            return false;
        return Math.abs(diff.length - baseLen) > baseLen * 1 / 3;
    }
    
}

Blob.EMPTY_BUFFER = EMPTY_BUFFER;
Blob.EMPTY_HASH = EMPTY_HASH;

