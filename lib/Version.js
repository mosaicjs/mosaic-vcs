import Promise from 'promise';
import VersionControlEntity from './VersionControlEntity';

/**
 * This class gives access to individual history versions. Each repository
 * version re-groups multiple resource revisions.
 */
export default class Version extends VersionControlEntity {
    
    /**
     * Returns a promise defining if this version was already committed.
     */
    isCommitted(){
        return this.loadMetadata().then(function(meta){
            return !!meta.hash;
        });
    }
    
    /**
     * Loads a list of parent versions (Version instances).
     */
    loadParentVersions(){
        return this.loadMetadata().then(function(meta) {
            // TODO: load parent ids using the meta.vid
            // TODO: create and return Version instances for each parent
            return [];
        }.bind(this));
    }
    
    /**
     * Loads and returns a list of child versions.
     */
    loadChildVersions(){
        return this.loadMetadata().then(function(meta) {
            // TODO: load children ids using the meta.vid
            // TODO: create and return Version instances for each child
            return [];
        }.bind(this));
    }
    
    /**
     * Loads metadata about this version.
     */
    loadMetadata() {
        if (!this._meta){
            this._meta = this.store.loadVersion({
                vid : this.options.id
            });
        }
        return this._meta;
    }
 
    /**
     * Returns a list of individual resource revisions (Revision instances). If
     * a list of paths is specified then only these resource revisions are
     * loaded. If a path prefix is defined then this method loads resources with
     * paths starting with this prefix. An additional 'shallow' parameter allows
     * to load only direct children of the path. If 'paths' / 'pathPrefix'
     * parameters are not defined then this method returns all resource
     * revisions corresponding to this version.
     * 
     * @param options.paths
     *            an optional list of resource paths to load
     * @param options.pids
     *            an optional list of paths identifiers for resources to load
     * @param options.pathPrefix
     *            an optional resource path prefix allowing to load resources
     *            starting with the given path prefix
     * @param options.shallow
     *            if this flag is <code>true</code> and a pathPrefix is
     *            defined then this method returns resources only direct
     *            resources
     * @return a list of Revision instances
     */ 
    loadRevisions(options) {
        return this.loadMetadata().then(function(){
            // TODO: load and return all revision instances associated with this
            // version factory
            return [];
        }.bind(this));
    }
    
    // ----------------------------------------------------------------------
    // Methods below require that this version was not committed

    /**
     * This method takes a list of resources (paths mapped to content) and
     * creates a list of revisions for these resources. The returned object is
     * the 'revisions' field for addRevisions / setRevisions methods.
     * 
     * <pre>
     * Example:
     * 
     *  let version = ...
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
     *            a mapping of paths to the corresponding Buffer objects
     * @return a mapping of paths to the corresponding Revision instances
     */ 
    buildRevisions(options){
        return this._checkNotCommitted().then(function(){
            // TODO: load all existing resource revisions for this version
            // TODO: load the Blob content for existing resources
            // TODO: create an empty Blob as a base for non-existing resources
            // TODO: create new Blob instance using new and old contents
            // TODO: create new Revision instances (pid, this:history , rid)
            // TODO: addRevisions or setRevisions
            return {};
        }.bind(this));
    }

    /**
     * Adds new resource revisions to already defined revisions in this version.
     * 
     * @param options.revisions
     *            a list of Revision instances
     */
    addRevisions(options){
        return this._checkNotCommitted().then(function(){
            // TODO: add newly added revisions
            // TODO: save a new path - version - blob association (pid-vid-rid):
            // store.storeVersionRevisions({vid,mapping:{pid-rid}})
        }.bind(this));
    }
    
    /**
     * Removes all already defined resource revisions for this version and sets
     * new revisions.
     * 
     * @param options.revisions
     *            a mapping of paths to the corresponding content objects
     */
    setRevisions(options){
        return this._checkNotCommitted().then(function(){
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
        return this._checkNotCommitted().then(function(){
            // TODO: remove revisions from the list
            // TODO: save all
        }.bind(this));
    }
    
    // ----------------------------------------------------------------------
    
    /**
     * Checks that this instance was opened and not committed.
     */
    _checkNotCommitted() {
        return this.loadMetadata().then(function(){
            if (this._committed) {
                throw new Error('This version was already committed'); 
            }
        }.bind(this));
    }
    
} 
