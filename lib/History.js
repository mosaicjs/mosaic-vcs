import Promise from 'promise';
import VersionControlEntity from './VersionControlEntity';

/**
 * Provides access to individual repository versions.
 */
export default class History extends VersionControlEntity {

    /**
     * Returns a version by tag, by hash or by an internal identifier. Options
     * of this method should take at least one of these parameters: 'hash', 'id'
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
