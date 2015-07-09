import Promise from 'promise';
import MemoryStore from './MemoryStore';

export default class MemoryVersionStore extends MemoryStore {
        
    // ------------------------------------------------------------------------
    
    /**
     * Stores a blob object.
     * 
     * @param options.content
     *            the content of the blob object
     */
    storeBlob(options) {
        let that = this;
        return Promise.resolve().then(function(){
            let content = options.content || new Buffer('', 'UTF-8');
            let blobs = that._blobs = that._blobs || {};
            let blobIds = that._blobIds = that._blobIds || {};
            let hash = options.hash;
            let blobId = blobIds[hash];
            let blob;
            if (blobId) {
                blob = blobs[blobId];
            } else {
                blobId = that._newId();
                blobIds[hash] = blobId;
                blob = blobs[blobId] = {
                    blobId : blobId,
                    content : content,
                    hash : hash,
                    length : content.length 
                };
            }
            let info = {
                blobId : blob.blobId,
                hash : blob.hash,
                length: blob.length
            };
            return info;
        });
    }
    
    /**
     * Loads a blob object by its identifier.
     * 
     * @param options.blobId
     *            the content of the blob object
     */
    loadBlob(options) {
        let that = this;
        return Promise.resolve().then(function(){
            let blobs = that._blobs = that._blobs || {};
            let blob = blobs[options.blobId];
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
            let blob = blobs[options.blobId];
            if (blob) {
                delete blobs[blob.blobId];
                delete blobIds[blob.hash];
            }
        });
    }
    
    // ------------------------------------------------------------------------
    
    storePaths(options){
        let that = this;
        return Promise.resolve().then(function(){
            let pathsToIds = that._pathsToIds = that._pathsToIds || {};
            let idsToPaths = that._idsToPaths = that._idsToPaths || {};
            let result = {};
            let paths = options.paths || [];
            paths.forEach(function(path){
                let id = pathsToIds[path];
                if (!id){
                    id = pathsToIds[path] = that._newId();
                }
                idsToPaths[id] = path;
                result[path] = id;
            });
            return result;
        });
    }

    loadPaths(options){
        let that = this;
        return Promise.resolve().then(function(){
            let result = {};
            if (options.pathIds){
                let idsToPaths = that._idsToPaths = that._idsToPaths || {};
                options.pathIds.forEach(function(pathId){
                    let path = idsToPaths[pathId];
                    result[path] = pathId;
                });
            } else {
                let paths = options.paths || [];
                let pathsToIds = that._pathsToIds = that._pathsToIds || {};
                paths.forEach(function(path){
                    let pathId = pathsToIds[path];
                    result[path] = pathId;
                });
            }
            return result;
        });
    }

    // ------------------------------------------------------------------------

    /**
     * Stores information about a new resource revision. This method should be
     * called after storing the basic version of the file content and a diff
     * patch applied to this basic version. So many revisions can use the same
     * content by applying to it their own diff patch. Diff patch is also stored
     * as a blob object.
     * 
     * @param options.length
     *            a full length of the content for the stored content
     * @param options.hash
     *            an SHA-1 hash of the content of this revision
     * @param options.contentId
     *            an internal identifier of the basic content blob for this
     *            revision
     * @param options.diffId
     *            an internal identifier of the diff blob
     * @return an object containing the same information as the options plus the
     *         internal identifier of this revision
     */
    storeRevisionInfo(options){
        let that = this;
        return Promise.resolve().then(function(){
            let revsIndex = that._revs = that._revs || {};
            let revsHashIndex = that._revsHashes = that._revsHashes || {};
            let info = revsHashIndex[options.hash];
            if (!info ) {
                info = {
                    revisionId: that._newId(),
                    length: options.length,
                    hash: options.hash,
                    contentId: options.contentId,
                    diffId: options.diffId
                };
                revsIndex[info.revisionId] = info;
                revsHashIndex[info.hash] = info;
            }
            return info;
        });
    }

    /**
     * Loads information about a revision using its internal identifier.
     * 
     * @param options.revisionId
     *            revision identifier
     */
    loadRevisionInfo(options){
        let that = this;
        return Promise.resolve().then(function(){
            let revsIndex = that._revs = that._revs || {};
            let info = revsIndex[options.revisionId];
            return info;
        });
    }
    
    /**
     * Loads information about a revision using content hash
     * 
     * @param options.hash
     *            content hash
     */
    loadRevisionInfoByHash(options){
        let that = this;
        return Promise.resolve().then(function(){
            let revsHashIndex = that._revsHashes = that._revsHashes || {};
            let info = revsHashIndex[options.hash];
            return info;
        });
    }

    // ------------------------------------------------------------------------
    // Repository version
    
    /**
     * Creates a new repository version.
     * 
     * @param options.versionId
     *            version identifier; if it is already defined then this method
     *            updates already existing version
     * @param options.stamp
     *            timestamp (in milliseconds) of this version
     * @param options.iid
     *            identier of a blob object containing meta-information about
     *            this version
     * @return an object containing the same fields as the options parameters +
     *         'versionId' - the version internal identifier
     */
    storeVersion(options){
        let that = this;
        return Promise.resolve().then(function(){
            let versions = that._versions = that._versions || {};
            let info;
            if (options.versionId){
                info = versions[options.versionId];
            }
            info = info || {};
            let versionId = info.versionId || that._newId();
            info = versions[versionId] = {
                versionId: versionId,
                stamp : options.stamp || info.stamp || new Date().getTime(),
                iid : options.iid || info.iid || undefined
            };
            return info;
        });
    }
    
    /**
     * Loads a repository version by its identifier.
     * 
     * @param options.versionId
     *            version identifier
     * @return version object containing the following fields a) versionId - version
     *         identifier b) stamp - timestamp of this version c) iid -
     *         identifier of the information blob containing meta-information
     *         about this version
     */
    loadVersion(options){
        let that = this;
        return Promise.resolve().then(function(){
            let versions = that._versions = that._versions || {};
            let info = versions[options.versionId];
            return info;
        });
    }

    // ------------------------------------------------------------------------

    /**
     * Creates a new resource revisions to the specified version.
     * 
     * @param options.versionId
     *            version identifier
     * @param options.mapping
     *            an object containing mapping of path identifiers to the
     *            corresponding revision identifiers
     * @param options.replace
     *            if this flag is <code>true</code> then all already defined
     *            paths are removed from this changeset and are replaced by the
     *            specified resource revisions; otherwise new resources are
     *            added to the changeset
     * @return a full mapping of path identifiers to the corresponding revision
     *         identifiers
     */
    storeVersionRevisions(options){
        let that = this;
        return Promise.resolve().then(function(){
            let changesets = that._changesets = that._changesets || {};
            let versionId = options.versionId;
            if (!versionId) throw new Error('Version id is not defined');
            let mapping = options.replace ? {} : (changesets[versionId] || {});
            let newMapping = options.mapping || {};
            let pathIds = Object.keys(newMapping).sort();
            pathIds.forEach(function(pathId){
                mapping[pathId] = newMapping[pathId];
            });
            return changesets[versionId] = mapping;
        });
    }
    
    /**
     * Loads mapping of path identifiers to the corresponding revisions.
     * 
     * @param options.versionId
     *            version identifier
     * @return object containing path identifiers with the corresponding
     *         revision identifiers
     */
    loadVersionRevisions(options){
        let that = this;
        return Promise.resolve().then(function(){
            let changesets = that._changesets = that._changesets || {};
            let versionId = options.versionId;
            if (!versionId) throw new Error('Version id is not defined');
            let mapping = (changesets[versionId] || {});
            return copy(mapping);
        });
    }

    // ------------------------------------------------------------------------

    /**
     * Sets version parents.
     * 
     * @param options.versionId
     *            version identifier
     * @param options.parentIds
     *            a list of parent version identifiers
     */
    storeVersionParents(options){
        let that = this;
        return Promise.resolve().then(function(){
            let parentsIndex = that._parents = that._parents || {};
            let childrenIndex = that._children = that._children || {};
            
            let versionId = options.versionId;
            if (!versionId) throw new Error('Version id is not defined');
            let parentIds = options.parentIds || [];
            let oldParents = parentsIndex[versionId] || [];
            oldParents.forEach(function(parentId){
                let children = childrenIndex[parentId];
                if (children){
                    delete children[versionId];
                }
            });
            parentsIndex[versionId] = parentIds;
            parentIds.forEach(function(parentId){
                let children = childrenIndex[parentId] = childrenIndex[parentId] || {};
                children[versionId] = true;
            });
            return parentIds;
        });
    }
    
    /**
     * Loads version parents
     * 
     * @param options.versionId
     *            version identifier
     * @return a list of identifiers of parent versions
     */
    loadVersionParents(options){
        let that = this;
        return Promise.resolve().then(function(){
            let parentsIndex = that._parents = that._parents || {};
            let versionId = options.versionId;
            if (!versionId) throw new Error('Version id is not defined');
            return (parentsIndex[versionId] || []);
        });
    }

    /**
     * Loads version children
     * 
     * @param options.versionId
     *            version identifier
     * @return a list of children versions
     */
    loadVersionChildren(options){
        let that = this;
        return Promise.resolve().then(function(){
            let childrenIndex = that._children = that._children || {};
            let versionId = options.versionId;
            if (!versionId) throw new Error('Version id is not defined');
            let children = childrenIndex[versionId] || {};
            return Object.keys(children).map(function(id){
                return id.parseInt(id);
            });
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

