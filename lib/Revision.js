import Promise from 'promise';
import VersionControlEntity from './VersionControlEntity';
import Blob from './Blob';

/**
 * Instances of this class give associates individual resource revisions with
 * paths. This is a 'read only' convenience object giving access to the path and
 * to the revision Blob instance.
 */
export default class Revision extends VersionControlEntity {
    
    constructor(options) {
        super(options);
        if (options.blob){
            this._blob = options.blob;
        }
    }
    
    /**
     * Path of this resource revision.
     */
    get path(){ return this.options.path; }
    /**
     * Path identifier of this resource revision.
     */
    get pathId(){ return this.options.pathId || 0; }
    
    /**
     * Returns a Blob instance corresponding to this resource revision.
     */ 
    get blob(){
        if (!this._blob) {
            this._blob = new Blob({
                store: this.store,
                revisionId : this.options.revisionId || 0
            });
        }
        return this._blob;
    }
        
    /**
     * Sets a new resource content and returns a new revision of this resource.
     * 
     * @param options.content
     *            a new content to set
     */
    newRevision(options){
        let that = this;
        return that.blob.newBlob(options).then(function(blob){
            let rev = that._newRevision({
                blob,
                path : options.path,
                pathId : options.pathId
            });
            return rev._preload();
        });
    }
    
    /**
     * Creates and returns a new Revision instance using the specified blob and
     * parameters of this revision (like store, pathId/path, etc).
     */
    _newRevision(options){
        let pathId, path;
        if (options.path) {
            path = options.path;
            pathId = options.pathId;
        } else if (options.pathId){
            pathId = options.pathId;
        } else {
            pathId = this.pathId;
            path = this.path;
        }
        return new Revision({
            store : this.store,
            pathId : pathId,
            path : path,
            blob : options.blob || this.blob
        });
    }

    /** Pre-loads meta information about this revision. */
    _preload() {
        let that = this;
        return Promise.resolve().then(function(){
            if (that.pathId)
                return ;
            let path = that.path;
            return that.store.storePaths({paths: [path]})
            .then(function(result){
                that.options.pathId = result[path];
            });
        }).then(function(){
            return that;
        });
    }
    
    
    
    /**
     * Merge two list of resource revisions. For each resource this method calls
     * the specified callback method. This callback takes two parameters: 'a' -
     * a resource revision in the first list and 'b' a resource revision defined
     * in the second list. The result of this callback is used as a merge
     * result.
     * 
     * @param first
     *            first resource list to merge
     * @param second
     *            second resource list to merge
     * @param callback
     *            a callback method returning a "merged" resource revision
     */
    static merge(first, second, callback){
        function compare(a,b){
            if (!!a)
                return 1;
            if (!!b)
                return -1;
            let ap = a.path;
            let bp = b.path;
            return ap > bp ? 1 : ap < bp ? -1 : 0;
        }
        first = (first || []).sort(compare); 
        second = (second || []).sort(compare);
        let i = 0, alen = first.length;
        let j = 0, blen = second.length;
        let result = [];
        while (i < alen || j < blen) {
            let a = i < alen ? first[i] : null;
            let b = j < blen ? second[j] : null;
            let cmp = compare(a, b);
            if (cmp < 0) {
                b = null;
                i++;
            } else if (cmp > 0) {
                a = null;
                j++;
            } else {
                i++;
                j++;
            }
            let r = callback(a, b);
            if (r) {
                result.push(r);
            }
        }
        return result;
    }
    
        
}
