import Promise from 'promise';

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
     * Stores a new version of a resource.
     * 
     * @param options.rid
     *            previous (base) resource revision; this revision is used to
     *            calculate delta; if this value is not defined the the whole
     *            resource content is stored
     * @param options.content
     *            resource content 
     */
    storeResourceRevision(options){
        
    }
    createProject(){
        return Promise.resolve().then(function(){
            return 'Hello';
        }.bind(this));
    }
    
}