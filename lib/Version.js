import Promise from 'promise';
import VersionControlEntity from './VersionControlEntity';
import Revision from './Revision';

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
    
    // ----------------------------------------------------------------------

    /**
     * Creates a new child version and copies all resource revisions from this
     * version to the newly created child.
     */ 
    createChildVersion(options) {
        let that = this;
        return that.loadMetadata().then(function(parentMeta){
            let version = that._newVersion();
            return version.loadMetadata(true).then(function(childMeta){
                let childId = childMeta.versionId;
                return that.store.storeVersionParents({
                    versionId : childId,
                    parentIds : [ parentMeta.versionId ]
                }).then(function(){
                    return that.loadRevisions().then(function(revisions) {
                        return version.storeRevisions({revisions});
                    });
                });
            }).then(function(){
                return version;
            });
        })
    }

    /**
     * Loads a list of parent versions (Version instances).
     */
    loadParentVersions(){
        return this._loadVersions('loadVersionParents');
    }
    
    /**
     * Loads and returns a list of child versions.
     */
    loadChildVersions(){
        return this._loadVersions('loadVersionChildren');
    }
    
    /**
     * Loads and returns a list of child or parent versions. It uses the
     * specified name of the store function to load parent or child version
     * identifiers.
     */
    _loadVersions(method){
        let that = this;
        return that.loadMetadata().then(function(meta) {
            return that.store[method]({
                versionId : meta.versionId
            }).then(function(parentIds){
                return Promise.all(parentIds.map(function(parentId) {
                    let version = that._newVersion({ versionId : parentId });
                    return version.loadMetadata().then(function(){
                        return version;
                    });
                }));
            });
        });
    }
    
    // ----------------------------------------------------------------------

    /**
     * Loads metadata about this version.
     */
    loadMetadata(force) {
        let that = this;
        if (!that._meta || force){
            that._meta = Promise.resolve()
            .then(function(){
                if (that.options.versionId) {
                    return that.store.loadVersion({
                        versionId : that.options.versionId
                    });
                } else {
                    return that.store.storeVersion({});
                }
            });
        }
        return that._meta;
    }
    
    // ----------------------------------------------------------------------

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
     * @param options.pathIds
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
        let that = this;
        return this.loadMetadata().then(function(meta){
            let versionId = meta.versionId;
            let result = [];
            return that.store.loadVersionRevisions({ versionId })
            .then(function(mapping){
                // This object contains path IDs (pathIds) mapped
                // to the corresponding revision IDs (revisionIds).
                let pathIds = Object.keys(mapping);
                return that.store.loadPaths({pathIds})
                .then(function(pathsMapping){
                    // pathsMapping - paths with the corresponding IDs
                    let paths = that._sortPaths(Object.keys(pathsMapping));
                    paths.forEach(function(path){
                        let pathId = pathsMapping[path]; // Path ID
                        let revisionId = mapping[pathId]; // Blob ID
                        let rev = that._newRevision({ revisionId, pathId, path });
                        result.push(rev);
                    })
                    return result;
                })
            });
        }.bind(this));
    }
    
    // ----------------------------------------------------------------------
    // Methods below require that this version was not committed
    
    /**
     * This method takes a list of resources (paths mapped to the content) and
     * adds them as new revisions for this version. It returns a list of added
     * revisions. If the 'replace' options of this method is <code>true</code>
     * then this method removes all already existing resource revisions and
     * replaces them by specified once.
     * 
     * <pre>
     * Example:
     * 
     *  let version = ...
     *  let promise = version.storeResources({
     *      resources : {
     *          'about/content.txt' : 'Hello, this is a short text about us',
     *          'about/.meta' : { title: 'About our team' },
     *          ... 
     *      }
     *  }).then(function(revisions){
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
    
    storeResources(options){
        let that = this;
        return that.buildRevisions(options).then(function(revisions){
            return that.storeRevisions({revisions});
        });
    }

    /**
     * This method takes a list of resources (paths mapped to the content) and
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
        let that = this;
        return that._checkNotCommitted().then(function(){
            let resources = options.resources;
            let paths = that._sortPaths(Object.keys(resources));
            return that.loadRevisions({paths}).then(function(revisions){
                let index = {};
                revisions.forEach(function(rev){
                    index[rev.path] = rev;
                });
                return Promise.all(paths.map(function(path){
                    let content = resources[path];
                    let normalizedPath = that._normalizePath(path);
                    let rev = index[normalizedPath] || that._newRevision({
                        path : normalizedPath
                    });
                    return rev.newRevision({content});
                }));
            });
        }.bind(this));
    }

    /**
     * Adds specified resource revisions to this version. If the options.replace
     * flag is <code>true</code> then this method removes all already existing
     * resource revisions and sets the specified once.
     * 
     * @param options.revisions
     *            a list of Revision instances
     * @param options.replace
     *            if this flag is <code>true</code> then all
     */
    storeRevisions(options){
        let that = this;
        return that._checkNotCommitted().then(function(meta){
            let revisions = options.revisions || [];
            let pathIds = [];
            let promises = [];
            revisions.forEach(function(rev){
                pathIds.push(rev.pathId);
                promises.push(rev.blob.loadMetadata());
            });
            return Promise.all(promises).then(function(blobsMeta){
                let mapping = {};
                pathIds.forEach(function(pathId, i) {
                    mapping[pathId] = blobsMeta[i].revisionId;
                });
                return that.store.storeVersionRevisions({
                    versionId : meta.versionId,
                    mapping : mapping,
                    replace : !!options.replace
                });
            }).then(function(){
                return revisions;
            });
        });
    }
    
    // ----------------------------------------------------------------------
   
    _normalizePath(path) {
        path = path || '';
        path = path.replace(/[\\\/]+/gim, '/');
        return path.replace(/^\//, '');
    }
    
    _newRevision(options){
        return new Revision({
            revisionId : options.revisionId,
            store : this.store,
            path : options.path,
            pathId : options.pathId
        })
    }
    
    _newVersion(options){
        options = options || {};
        let version = new Version({
            versionId : options.versionId || undefined,
            store: this.store,
        });
        return version;
    }
    
    _sortPaths(paths){
        let result = [];
        if (Array.isArray(paths)) {
            result = paths.sort();
        }
        return paths;
    }
    
    /**
     * Checks that this instance was opened and not committed.
     */
    _checkNotCommitted() {
        return this.loadMetadata().then(function(meta){
            if (this._committed) {
                throw new Error('This version was already committed'); 
            }
            return meta;
        }.bind(this));
    }
    
} 
