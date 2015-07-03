import Promise from 'promise';

export default class MemoryStore {
    constructor(options){
        this.options = options || {};
    }
    open(){ return Promise.resolve(); }
    close(){ return Promise.resolve(); }
    readTransaction(method) {
        return Promise.resolve().then(function(){
            return (method.bind(this))();
        }.bind(this));
    }
    writeTransaction(method) {
        return Promise.resolve().then(function(){
            return (method.bind(this))();
        }.bind(this));
    }
}