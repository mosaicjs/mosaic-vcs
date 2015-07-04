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
        this._testRevInfo();
        this._testFileNames();
        this._testBlobs();
        this._testMimeTypes();
    }

    _testRevInfo() {
        let that = this;
        that._write('should store/read revision information', function(){
            let content = new Buffer('Hello, world', 'UTF-8');
            let hash = Digest.digest(content);
            let nameId = 1;
            let mimeId = 2;
            let contentId = 3;
            let diffId = 4;
            let stamp = new Date().getTime();
            let revInfo = {
                nid : nameId,
                mid : mimeId,
                length: content.length,
                hash: hash,
                content: contentId,
                diff: diffId,
                stamp: stamp
            };
            let revId;
            return Promise.resolve()
            .then(function(){
                return that.store.storeRevisionInfo(revInfo).then(function(info){
                    expect(!!info).to.be(true);
                    expect(!!info.rid).to.be(true);
                    revId = info.rid;
                    expect(info.nid).to.eql(revInfo.nid);
                    expect(info.mid).to.eql(revInfo.mid);
                    expect(info.length).to.eql(revInfo.length);
                    expect(info.hash).to.eql(revInfo.hash);
                    expect(info.content).to.eql(revInfo.content);
                    expect(info.diff).to.eql(revInfo.diff);
                    expect(info.stamp).to.eql(revInfo.stamp);
                });
            })
            .then(function(){
                return that.store.loadRevisionInfo({rid:revId}).then(function(info){
                    expect(!!info).to.be(true);
                    expect(info.rid).to.eql(revId);
                    expect(info.nid).to.eql(revInfo.nid);
                    expect(info.mid).to.eql(revInfo.mid);
                    expect(info.length).to.eql(revInfo.length);
                    expect(info.hash).to.eql(revInfo.hash);
                    expect(info.content).to.eql(revInfo.content);
                    expect(info.diff).to.eql(revInfo.diff);
                    expect(info.stamp).to.eql(revInfo.stamp);
                });
            });
        });
    }
    
    _testFileNames() {
        let that = this;
        that._write('should store/read file names', function(){
            let paths = ['foo/bar/file.doc', 'foo/bar/toto.pdf', 'foo/about.md'];
            let pathIndex;
            return Promise.resolve()
            .then(function(){
                return that.store.storePaths({paths}).then(function(info){
                    expect(!!info).to.be(true);
                    expect(Object.keys(info).sort()).to.eql(paths.sort());
                    pathIndex = info;
                });
            })
            .then(function(){
                return that.store.loadPaths({paths}).then(function(info){
                    expect(info).to.eql(pathIndex);
                })
            });
        });
    }
    
    _testBlobs(){
        let that = this;
        that._write('should store / load blobs', function(){
            let str = 'This is a content';
            let content = new Buffer(str, 'UTF-8');
            let hash = Digest.digest(content);
            let id;
            return Promise.resolve()
            
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
            });
        });
    }
    
    _testMimeTypes(){
        let that = this;
        that._read('should return an empty list of mime types', function() {
            return that.store.loadMimeTypes().then(function(mimes){
                expect(mimes).to.eql({});
            });
        });
        that._read('should be able to register new mime types', function() {
            let list = ['text/plain', 'text/x-diff', 'application/binary'];
            let index;
            return that.store.storeMimeTypes({
                types: list
            }).then(function(mimes){
                expect(Object.keys(mimes).sort()).to.eql(list.sort());
                index = mimes;
            }).then(function(){
                return that.store.loadMimeTypes({types: list}).then(function(mimes){
                    expect(mimes).to.eql(index);
                });
            });
        });
    }
    
    // ------------------------------------------------------------------
    // Utility test methods
    
    _write(msg, f) { 
        let that = this;
        it(msg, function(done){
            that.store.writeTransaction(function(){
                return f.apply(that);
            }).then(done, done);
        });
    }
    _read(msg, f) { 
        let that = this;
        it(msg, function(done){
            that.store.readTransaction(function(){
                return f.apply(that);
            }).then(done, done);
        });
    }
    
}

