import Promise from 'promise';
import Digest from './utils/Digest';
import BinDelta from './utils/BinDelta';
import VersionControlEntity from './VersionControlEntity';

/**
 * This class gives access to already committed history versions.
 */
class Version extends VersionControlEntity {
    
    _onOpen(){
        // TODO: load the version object with all meta-information
    }
}
}
 
export default class VersionControl  {
    constructor(options){
        this.store = options.store;
    }
    open(){
        return Promise.resolve().then(function(){
            return this.store.open();
        }.bind(this));
    }
    close(){
        return Promise.resolve().then(function(){
            return this.store.close();
        }.bind(this));
    }
    
    /**
     * Stores a new resource revision.
     * 
     * @param options.base
     *            a hash of the base resource revision; this revision is used to
     *            calculate delta; if this value is not defined the the whole
     *            resource content is stored
     * @param options.content
     *            resource content
     * @return a revision info object
     */
    storeResourceRevision(options){
        let that = this;
        return that.store.writeTransaction(function(){
            let content = options.content;
            let hash = Digest.digest(content);
            return that.store.loadRevisionInfoByHash({hash}).then(function(info){
                // This revision is already stored
                if (info)
                    return info;

                // Create a new revision
                let result = {
                    length: content.length,
                    hash: hash,
                    content: 0,
                    diff: 0
                };
                // Load a base revision
                return that.store.loadRevisionInfoByHash({hash: options.base})
                    .then(function(baseInfo) {
                    baseInfo = baseInfo || {};
                    return that._loadBlob({id:baseInfo.content})
                    .then(function(base){
                        base = base || {};
                        let baseLen = base.length || 0;
                        let diff = that._buildDiff(base.content, content);
                        if (that._shouldStoreDiff(diff, baseLen)) {
                            return that._storeBlob({
                                content : diff,
                                hash : Digest.digest(diff)
                             }).then(function(diffInfo){
                                result.content = baseInfo.content;
                                result.diff = diffInfo.id;
                            });
                        } else {
                            return that._storeBlob({
                                content: content,
                                hash : hash
                            }).then(function(contentInfo){
                                result.content = contentInfo.id;
                            });
                        }
                    })
                    .then(function(){
                        return that.store.storeRevisionInfo(result);
                    });
                });
            })
        });
    }
    
    /** Loads a resource by its hash */
    loadResourceRevision(options) {
        let that = this;
        return that.store.readTransaction(function(){
            let hash = options.hash;
            let result = {
                hash : hash,
            };
            return that.store.loadRevisionInfoByHash({hash}).then(function(info){
                result.info = info;
                if (!info)
                    return ;
                result.rid = info.rid;
                result.length = info.length;
                return Promise.all([
                    that._loadBlob({id:info.content}), 
                    that._loadBlob({id:info.diff}) 
                ]).then(function(list){
                    let baseContent = list[0] || {};
                    let diffContent = list[1] || {};
                    result.content = 
                        that._applyDiff(baseContent.content, diffContent.content);
                });
            }).then(function(){
                return result;
            });
        });
    }
   
    newVersion(options){
        let that = this;
        return Promise.resolve().then(function(){
            let base = options.base || [];
            let version = new Version({
                store : that.store,
                base : base
            });
            return version.create();
        });
    }
    
    _loadBlob(options) {
        let that = this;
        return Promise.resolve().then(function(){
            if (!options.id)
                return ;
            return that.store.loadBlob(options).then(function(result){
                // TODO: Inflate the result.content field after loading
                return result;
            });
        });
    }
    
    _shouldStoreDiff(diff, baseLen) {
        if (!diff)
            return false;
        return Math.abs(diff.length - baseLen) > baseLen * 1 / 3;
    }
    _storeBlob(options){
        let that = this;
        return Promise.resolve().then(function(){
            // TODO: Deflate the result.content field before saving
            return that.store.storeBlob(options).then(function(result){
                return result;
            });
        });
    }
    _buildDiff(from, to){
        if (!from || !to)
            return ;
        return BinDelta.diff(from, to);
    }
    _applyDiff(from, diff){
        if (!from || !diff)
            return from;
        return BinDelta.patch(from, diff);
    }
    
    createProject(){
        return Promise.resolve().then(function(){
            return 'Hello';
        }.bind(this));
    }
    
}