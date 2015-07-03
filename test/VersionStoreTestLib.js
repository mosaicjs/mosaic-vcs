import expect from 'expect.js';
import { VersionControl } from '../';
import { Digest } from '../';

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
        this._testBlobs();
        this._testMimeTypes();
    }
    
    _testBlobs(){
        let that = this;
        it ('should store / load blobs', function(done){
            let str = 'This is a content';
            let content = new Buffer(str, 'UTF-8');
            let hash = Digest.digest(content);
            let id;
            Promise.resolve()
            
            // Store a blob and check that it is available
            .then(function(){
                return that.store.storeBlob({
                    content : content
                 });
            }).then(function(info){
                expect(!!info).to.be(true);
                expect(info.length).to.eql(content.length);
                expect(info.hash).to.eql(hash);
                expect(!!info.id).to.be(true);
                id = info.id;
            })
            
            // Load blob by id
            .then(function(){
                return that.store.loadBlob({id});
            }).then(function(info){
                expect(info.hash).to.eql(hash);
                expect(info.id).to.eql(id);
                expect(!!info.content).to.be(true);
                expect(Digest.digest(info.content)).to.eql(hash);
                expect(info.content.toString()).to.eql(str);
            })
            
            // Delete blob 
            .then(function(info){
                return that.store.deleteBlob({id});
            }).then(function(){
                return that.store.loadBlob({id});
            }).then(function(info){
                expect(info).to.be(undefined);
            }).then(done, done);
        });
    }
    
    _testMimeTypes(){
        let that = this;
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

