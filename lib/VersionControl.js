import Promise from 'promise';
import Digest from './utils/Digest';
import BinDelta from './utils/BinDelta';

class VersionControlEntity {
    constructor(options){
        this.options = options || {};
    }
}

/**
 * Provides access to individual repository versions.
 */
class History extends VersionControlEntity {

    /**
     * Returns a version by tag, by hash or by an internal identifier. Options
     * of this method should take at least one of these parameters 'hash', 'id'
     * or 'tag'
     * 
     * @param options.hash
     *            hash of a committed version to loaded
     * @param options.id
     *            an internal identifier of the version
     * @param options.tag
     *            a tag of the version to load (like 'HEAD')
     */
    getVersion(options){
        let that = this;
        return Promise.resolve().then(function(){
            return null;
        });
    }
    
    /**
     * Creates and returns a new non-committed version. In a non-committed
     * version users can add/remove new resources. Committed version is
     * unchangeable. To inherit all parent resources the Version#merge method
     * should be called.
     * 
     * @param options.parents
     *            a list of parent versions (Version instances); could be empty
     */
    newVersion(options){
        let that = this;
        return Promise.resolve().then(function(){
            return null;
        });
    }
    
}

/**
 * Returns an individual resource revision object. It gives access to the
 * resource content.
 */
class Revision extends VersionControlEntity {
    
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
}

/**
 * Common parent for the Version and VersionFactory classes.
 */
class VersionBase extends VersionControlEntity {

    /**
     * Initializes / open this factory. It checks that there is an internal
     * identifier for this object. Otherwise it creates a new object in the DB
     * and loads such an identifier.
     */
    open(){
        if (!this._openPromise) {
            this._openPromise = Promise.resolve().then(function(){
                return this._onOpen();
                this._opened = true;
            }.bind(this));
        }
        return this._openPromise;
    }
    
    /**
     * Loads a list of parent versions (Version instances).
     */
    loadParentVersions(){
        return this.loadMetadata().then(function(meta) {
            
        }.bind(this));
    }
    
    /** Loads metadata about this version. */
    loadMetadata() {
        if (!this._meta){
            this._meta = this.store.loadVersion({
                vid : this.options.id
            });
        }
        return this._meta;
    }
 
    /**
     * Returns a mapping of resource paths to the corresponding revisions
     * associated with this version. If a list of paths is specified then only
     * these resource revisions are loaded. Otherwise all resource revisions are
     * loaded.
     * 
     * @param options.paths
     *            an optional list of resource paths to load
     * @param options.pids
     *            an optional list of paths identifiers for resources to load
     * @return an object containing resource paths as keys and the corresponding
     *         Revision instances as values
     */ 
    getRevisions(options) {
        return this._check(true).then(function(){
            // TODO: load and return all revision instances associated with this
            // version factory
        }.bind(this));
    }
    
    /**
     * Checks that this instance was opened and not committed.
     */
    _check(ignoreUncommitted) {
        return Promise.resolve().then(function(){
            if (!this._openPromise){
                throw new Error('This factory was not initialized / opened.');
            }
            if (!ignoreUncommitted && this._committed) {
                throw new Error('This version was already committed'); 
            }
        }.bind(this));
    }
    
    /**
     * This method is called to initialize resources associated with this
     * version.
     */
    _onOpen(){
    }
} 

/**
 * This class gives access to already committed history versions.
 */
class Version extends VersionControlEntity {
    
    _onOpen(){
        // TODO: load the version object with all meta-information
    }
}

/**
 * Factories for new history versions.
 */
class VersionFactory extends VersionControlEntity {
    
    constructor(...params) {
        super(...params);
        this.info = this.options.info;
    }

    /**
     * Initializes / open this factory. It checks that there is an internal
     * identifier for this object. Otherwise it creates a new object in the DB
     * and loads such an identifier.
     */
    _onOpen(){
        if (!this.options.vid) {
            // TODO: create a new version instance in the DB
        }
    }    
    
    /**
     * Returns all resource revisions managed by this factory. This factory
     * should be already opened.
     */ 
    getRevisions() {
        return this._check(true).then(function(){
            // TODO: load and return all revision instances associated with this
            // version factory
        }.bind(this));
    }
    
    /**
     * This method takes a list of resources (paths mapped to content) and
     * creates a list of revisions for these resources. The returned object is
     * the 'revisions' field for addRevisions / setRevisions methods.
     * 
     * <pre>
     * Example:
     * 
     *  let version = history.
     *  let promise = version.buildRevisions({
     *      resources : {
     *          'about/content.txt' : 'Hello, this is a short text about us',
     *          'about/.meta' : { title: 'About our team' },
     *          ... 
     *      }
     *  }).then(function(revisions){
     *      return version.addRevisions({ revisions });
     *  }).then(function(){
     *      return version.commit({
     *          message: 'This is a short commit message',
     *          stamp : new Date().getTime()
     *      });
     *  });
     * </pre>
     * 
     * @param options.resources
     *            a mapping of paths to the corresponding content objects
     * @return result.revisions
     */ 
    buildRevisions(options){
        return this._check().then(function(){
            // TODO: create resource revisions
            // TODO: save the content
            return {};
        }.bind(this));
    }

    /**
     * Adds new resource revisions to already defined revisions in this version.
     * 
     * @param options.revisions
     *            a list of Revision instances to add
     */
    addRevisions(options){
        return this._check().then(function(){
            // TODO: add newly added revisions
            // TODO: save all
        }.bind(this));
    }
    
    /**
     * Sets new resource revisions to this version.
     * 
     * @param options.revisions
     *            a list of Revision instances to set
     */
    setRevisions(options){
        return this._check().then(function(){
            // TODO: replace existing revisions by the new ones
            // TODO: saves all revisions
        }.bind(this));
    }
    
    /**
     * Removes specified resource revisions from this version.
     * 
     * @param options.ids
     *            a list of Revision identifiers
     * @param options.revisions
     *            a list of Revision instances to remove
     */
    removeRevisions(options){
        return this._check().then(function(){
            // TODO: remove revisions from the list
            // TODO: save all
        }.bind(this));
    }
    
    // ----------------------------------------------------------------------
    
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