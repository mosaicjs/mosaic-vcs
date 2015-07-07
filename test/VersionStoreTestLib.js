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
        this._testVersions();
        this._testVersionRevisions();
        this._testVersionParents();
        this._testRevInfo();
        this._testPaths();
        this._testBlobs();
    }
    
    _testVersionParents(){
        let that = this;
        let v1 = 1;
        let v2 = 2;
        let v3 = 3;
        let v4 = 4;
        let v5 = 5;
        that._write('should store/load relations between version', function(){
            return Promise.all([v1, v2, v3, v4, v5].map(function(vid){
                return that.store.loadVersionParents({vid: vid})
                .then(function(parents){
                    expect(parents).to.eql([]);
                    return that.store.loadVersionChildren({vid:vid})
                    .then(function(children){
                        expect(parents).to.eql([]);
                    });
                });
            }))
            
            .then(function(){
                return Promise.all([
                    that.store.storeVersionParents({
                        vid: v2,
                        parents: [v1]
                    }).then(function(parents){ expect(parents).to.eql([v1]) }),
                    that.store.storeVersionParents({
                        vid: v3,
                        parents: [v1]
                    }).then(function(parents){ expect(parents).to.eql([v1]) }),
                    that.store.storeVersionParents({
                        vid: v4,
                        parents: [v2, v3]
                    }).then(function(parents){ expect(parents).to.eql([v2,v3]) }),
                    that.store.storeVersionParents({
                        vid: v5,
                        parents: [v3]
                    }).then(function(parents){ expect(parents).to.eql([v3]) })
                ])
                .then(function(){
                    return Promise.all([
                        that.store.loadVersionParents({ vid: v2 })
                        .then(function(parents){ expect(parents).to.eql([v1]) }),
                        
                        that.store.loadVersionParents({ vid: v3 })
                        .then(function(parents){ expect(parents).to.eql([v1]) }),
                        
                        that.store.loadVersionParents({ vid: v4 })
                        .then(function(parents){ expect(parents).to.eql([v2,v3]) }),
                        
                        that.store.loadVersionParents({ vid: v5 })
                        .then(function(parents){ expect(parents).to.eql([v3]) })
                    ]);
                })
                .then(function(){
                    
                });
            });
        });
    }
    
    _testVersionRevisions(){
        let that = this;
        let count = 10;
        let vid = 50;
        let mapping = {};
        for (let i=0; i < count; i++) {
            mapping[i] = i + count * 2;
        }
        that._write('should store/load version changeset items', function(){
            return Promise.resolve().then(function(){
                return that.store.storeVersionRevisions({ vid, mapping });
            }).then(function(result){
                expect(result).to.eql(mapping);
                let newMapping = {};
                for (let i = count * 3; i < count * 4; i++) {
                    mapping[i] = newMapping[i] = i + count * 2;
                }
                return that.store.storeVersionRevisions({ vid, mapping: newMapping });
            }).then(function(result){
                expect(result).to.eql(mapping);
                return that.store.loadVersionRevisions({ vid });
            }).then(function(result){
                expect(result).to.eql(mapping);
            });
        });
    }

    _testVersions(){
        let that = this;
        let version = {
            stamp : new Date().getTime(),
            iid : 123
        };
        let control;
        that._write('should store/read version information', function(){
            return Promise.resolve()
            .then(function(){
                return that.store.storeVersion(version).then(function(info){
                    expect(!!info.vid).to.be(true);
                    expect(info.stamp).to.eql(version.stamp);
                    expect(info.iid).to.eql(version.iid);
                    control = info;
                });
            })
            .then(function(){
                return that.store.loadVersion({vid:control.vid}).then(function(info){
                    expect(info).to.eql(control);
                });
            })
            .then(function(){
                version.vid = control.vid;
                version.stamp += 100000;
                version.iid = 324;
                return that.store.storeVersion(version).then(function(info){
                    expect(info).to.eql(version);
                });
            })
        });
    }
    
    _testRevInfo() {
        let that = this;
        that._write('should store/read revision information', function(){
            let content = new Buffer('Hello, world', 'UTF-8');
            let hash = Digest.digest(content);
            let contentId = 2;
            let diffId = 3;
            let revInfo = {
                length: content.length,
                hash: hash,
                content: contentId,
                diff: diffId
            };
            let revId;
            return Promise.resolve()
            .then(function(){
                return that.store.storeRevisionInfo(revInfo).then(function(info){
                    expect(!!info).to.be(true);
                    expect(!!info.rid).to.be(true);
                    revId = info.rid;
                    expect(info.length).to.eql(revInfo.length);
                    expect(info.hash).to.eql(revInfo.hash);
                    expect(info.content).to.eql(revInfo.content);
                    expect(info.diff).to.eql(revInfo.diff);
                });
            })
            .then(function(){
                return that.store.loadRevisionInfo({rid:revId}).then(function(info){
                    expect(!!info).to.be(true);
                    expect(info.rid).to.eql(revId);
                    expect(info.length).to.eql(revInfo.length);
                    expect(info.hash).to.eql(revInfo.hash);
                    expect(info.content).to.eql(revInfo.content);
                    expect(info.diff).to.eql(revInfo.diff);
                });
            })
            .then(function(){
                return that.store.loadRevisionInfoByHash({hash:hash}).then(function(info){
                    expect(!!info).to.be(true);
                    expect(info.rid).to.eql(revId);
                    expect(info.length).to.eql(revInfo.length);
                    expect(info.hash).to.eql(revInfo.hash);
                    expect(info.content).to.eql(revInfo.content);
                    expect(info.diff).to.eql(revInfo.diff);
                });
            });
        });
    }
    
    _testPaths() {
        let that = this;
        that._write('should store/read paths', function(){
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
                    content : content,
                    hash : hash
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

