export default class VersionControlEntity {
    constructor(options){
        this.options = options || {};
        this.store = this.options.store;
    }
    _call(method){
        let that = this;
        return Promise.resolve().then(function(){
            return method.call(that);
        });
    }
    readTransaction(method){
        return this._call(method);
        return this.store.readTransaction(method.bind(this));
    }
    writeTransaction(method){
        return this._call(method);
        return this.store.readTransaction(method.bind(this));
    }
}
