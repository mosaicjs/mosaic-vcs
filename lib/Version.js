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
    
    // ----------------------------------------------------------------------

    /**
     * Loads metadata about this version.
     */
    loadMetadata() {
        let that = this;
        if (!that._meta){
            that._meta = Promise.resolve()
            .then(function(){
                if (that.options.id) {
                    return that.store.readTransaction(function(){
                        return that.store.loadVersion({
                            vid : that.options.id
                        });
                    });
                } else {
                    return that.store.writeTransaction(function(){
                        return that.store.storeVersion({});
                    });
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
        let that = this;
        return this.loadMetadata().then(function(meta){
            let vid = meta.vid;
            let result = [];
            return that.store.readTransaction(function(){
                return that.store.loadVersionRevisions({
                    vid : meta.vid
                }).then(function(mapping){
                    // This object contains path IDs (pids) mapped
                    // to the corresponding revision IDs (rids).
                    let pids = Object.keys(mapping);
                    return that.store.loadPaths({pids})
                    .then(function(pathsMapping){
                        // pathsMapping - paths with the corresponding IDs
                        let paths = that._normalizePaths(Object.keys(pathsMapping));
                        paths.forEach(function(path){
                            let pid = pathsMapping[path]; // Path ID
                            let bid = mapping[pid]; // Blob ID
                            let rev = that._newRevision({
                                bid, // Blob ID
                                pid, // Path ID
                                path // Path
                            });
                            result.push(rev);
                        })
                        return result;
                    })
                });
            });
        }.bind(this));
    }
    
    // ----------------------------------------------------------------------
    // Methods below require that this version was not committed

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
            let paths = that._normalizePaths(Object.keys(resources));
            return that.loadRevisions({paths}).then(function(revisions){
                let index = {};
                revisions.forEach(function(rev){
                    index[rev.path] = rev;
                });
                return Promise.all(paths.map(function(path){
                    let content = resources[path];
                    let rev = index[path] || that._newRevision({path});
                    return rev.newRevision(content);
                }));
            });
        }.bind(this));
    }

    /**
     * Associates a new list of resource revisions with this version.
     * 
     * @param options.revisions
     *            a list of Revision instances
     */
    storeRevisions(options){
        let that = this;
        return this._checkNotCommitted().then(function(meta){
            let revisions = options.revisions || [];
            let pids = [];
            let promises = [];
            revisions.forEach(function(rev){
                pids.push(rev.pid);
                promises.push(rev.blob.loadMetadata());
            });
            return Promise.all(promises).then(function(blobsMeta){
                let mapping = {};
                pids.forEach(function(pid, i) {
                    mapping[pid] = blobsMeta[i].rid;
                });
                return that.store.writeTransaction(function(){
                    return that.store.storeVersionRevisions({
                        vid : meta.vid,
                        mapping : mapping
                    });
                });
            }).then(function(){
                return revisions;
            });
        }.bind(this));
    }
    
    // ----------------------------------------------------------------------
    
    _newRevision(options){
        return new Revision({
            store : this.store,
            path : options.path,
            pid : options.pid,
            bid : options.bid
        })
    }
    
    _normalizePaths(paths){
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
