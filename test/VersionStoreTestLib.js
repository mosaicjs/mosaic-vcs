import expect from 'expect.js';
import { VersionControl } from '../';

export default class VersionControlTestLib {
    
    constructor(options){
        options = options || {};
        this.newStore = options.newStore;
        this.deleteStore = options.deleteStore;
    }

    run(){
        let that = this;
        before(function(done){
            Promise.resolve().then(function(){
                return that.newStore();
            }).then(function(store){
                that.store = store;
                return that.store.open();
            }).then(done, done);
        });
        after(function(done){
            let error;
            Promise.resolve().then(function(){
                return that.store.close();  
            }).then(null, function(err){
                error = err;
            }).then(function(){
                return that.deleteStore(that.store);
            }).then(function(){
                delete that.store;
                if (error) throw error;
            }).then(done, done);
        });
        it('should return an empty list of mime types', function(done) {
            that.store.loadMimeTypes().then(function(mimes){
                expect(mimes).to.eql({});
            }).then(done, done);
        });
        it('should be able to register new mime types', function(done) {
            let list = ['text/plain', 'text/x-diff', 'application/binary'];
            that.store.storeMimeTypes({
                types: list
            }).then(function(mimes){
                expect(Object.keys(mimes).sort()).to.eql(list.sort());
            }).then(done, done);
        });
    }
    
}

