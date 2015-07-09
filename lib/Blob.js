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
        let that = this;
        if (!that._meta) {
            that._meta = that.store.loadRevisionInfo({
                revisionId: that.options.revisionId
            }).then(function(meta){
                return meta || {
                    revisionId: 0,
                    length: 0,
                    hash: EMPTY_HASH,
                    contentId: 0,
                    diffId: 0
                };
            });
        }
        return that._meta;
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
                    that.store.loadBlob({ blobId : meta.contentId }), 
                    that.store.loadBlob({ blobId : meta.diffId }) 
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
        return that.loadContent().then(function(oldContent){
            let newContent = that._serializeContent(options.content);
            // Build a diff
            let diff = that._buildDiff(oldContent, newContent);
            // Create a new revision
            let revisionInfo = {
                length: newContent.length,
                hash: Digest.digest(newContent),
                contentId: 0, // Identifier of the base content
                diffId: 0 // Identifier of the diff
            };
            if (!!diff) {
                // If a diff is defined then store the diff object
                // and update the revisionInfo
                return that.store.storeBlob({
                    content : diff,
                    hash : Digest.digest(diff)
                }).then(function(diffBlobInfo){
                    revisionInfo.diffId = diffBlobInfo.blobId;
                    return that.loadMetadata().then(function(oldMeta){
                        revisionInfo.contentId = oldMeta.contentId;
                        return revisionInfo;
                    });
                });
            } else {
                // Diff was not defined => store a new blob as is.
                return that.store.storeBlob({
                    content: newContent,
                    hash : revisionInfo.hash
                }).then(function(newContentBlobInfo){
                    revisionInfo.contentId = newContentBlobInfo.blobId;
                    return revisionInfo;
                });
            }
        }).then(function(revisionInfo){
            return that.store.storeRevisionInfo(revisionInfo)
            .then(function(meta){
                return that._newBlobRevision(meta.revisionId);
            });
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
        return BinDelta.patch(content, diff);
    }
    
    _newBlobRevision(revisionId){
        return new Blob({
            store : this.store,
            revisionId : revisionId
        });
    }

    _serializeContent(content){
        if (Buffer.isBuffer(content))
            return content;
        if (!content) {
            content = '';
        }
        content = JSON.stringify(content);
        return new Buffer(content, 'UTF-8');
    }
    
    /**
     * Returns <code>true</code> if the specified diff object should be
     * stored.
     */
    _shouldStoreDiff(diff, baseLen) {
        if (!diff)
            return false;
        return Math.abs(diff.length - baseLen) > baseLen * 2 / 3;
    }
    
}

Blob.EMPTY_BUFFER = EMPTY_BUFFER;
Blob.EMPTY_HASH = EMPTY_HASH;

