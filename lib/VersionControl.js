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
    createProject(){
        return Promise.resolve().then(function(){
            return 'Hello';
        }.bind(this));
    }
    
}