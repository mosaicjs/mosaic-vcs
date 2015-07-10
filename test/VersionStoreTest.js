import expect from 'expect.js';
import vc from '../';
import AbstractStoreTest from './AbstractStoreTest';
let Digest = vc.utils.Digest;

export default class VersionControlTest extends AbstractStoreTest {

    testAll(){
        this._testBlobs();
        this._testVersions();
        this._testVersionRevisions();
        this._testVersionParents();
        this._testRevInfo();
        this._testPaths();
    }
    
    _testVersionParents(){
        let that = this;
        let v1 = 1;
        let v2 = 2;
        let v3 = 3;
        let v4 = 4;
        let v5 = 5;
        that._write('should store/load relations between version', function(){
            return Promise.all([v1, v2, v3, v4, v5].map(function(versionId){
                return that.store.loadVersionParents({versionId})
                .then(function(parentIds){
                    expect(parentIds).to.eql([]);
                    return that.store.loadVersionChildren({versionId})
                    .then(function(children){
                        expect(parentIds).to.eql([]);
                    });
                });
            }))
            
            .then(function(){
                return Promise.all([
                    that.store.storeVersionParents({
                        versionId: v2,
                        parentIds: [v1]
                    }).then(function(parentIds){ expect(parentIds).to.eql([v1]) }),
                    that.store.storeVersionParents({
                        versionId: v3,
                        parentIds: [v1]
                    }).then(function(parentIds){ expect(parentIds).to.eql([v1]) }),
                    that.store.storeVersionParents({
                        versionId: v4,
                        parentIds: [v2, v3]
                    }).then(function(parentIds){ expect(parentIds).to.eql([v2,v3]) }),
                    that.store.storeVersionParents({
                        versionId: v5,
                        parentIds: [v3]
                    }).then(function(parentIds){ expect(parentIds).to.eql([v3]) })
                ])
                .then(function(){
                    return Promise.all([
                        that.store.loadVersionParents({ versionId: v2 })
                        .then(function(parentIds){ expect(parentIds).to.eql([v1]) }),
                        
                        that.store.loadVersionParents({ versionId: v3 })
                        .then(function(parentIds){ expect(parentIds).to.eql([v1]) }),
                        
                        that.store.loadVersionParents({ versionId: v4 })
                        .then(function(parentIds){ expect(parentIds).to.eql([v2,v3]) }),
                        
                        that.store.loadVersionParents({ versionId: v5 })
                        .then(function(parentIds){ expect(parentIds).to.eql([v3]) })
                    ]);
                })
                .then(function(){
                    
                });
            });
        });
    }
    
    _testVersionRevisions(){
        let that = this;
        let count = 30;
        let versionId = 50;
        let mapping = {};
        for (let i=0; i < count; i++) {
            mapping[i] = i + count * 2;
        }
        let newMapping = {};
        for (let i = Math.round(count * 3 / 5) ; i < Math.round(count * 4 / 5); i++) {
            newMapping[i] = i + count * 2;
        }
        
        that._write('should store/load version changeset items', function(){
            return Promise.resolve().then(function(){
                return that.store.storeVersionRevisions({ versionId, mapping });
            }).then(function(result){
                expect(result).to.eql(mapping);
                for (let i in newMapping) {
                    mapping[i] = newMapping[i];
                }
                return that.store.storeVersionRevisions({ versionId, mapping: newMapping });
            }).then(function(result){
                expect(result).to.eql(mapping);
                return that.store.loadVersionRevisions({ versionId });
            }).then(function(result){
                expect(result).to.eql(mapping);
                return that.store.storeVersionRevisions({
                    versionId,
                    mapping : newMapping,
                    replace : true
                });
            }).then(function(result){
                expect(result).to.eql(newMapping);
            });
        });
    }

    _testVersions(){
        let that = this;
        let version = {
            stamp : new Date().getTime(),
            metadataId : 123
        };
        let control;
        that._write('should store/read version information', function(){
            return Promise.resolve()
            .then(function(){
                return that.store.storeVersion(version).then(function(info){
                    expect(!!info.versionId).to.be(true);
                    expect(info.stamp).to.eql(version.stamp);
                    expect(info.metadataId).to.eql(version.metadataId);
                    control = info;
                });
            })
            .then(function(){
                return that.store.loadVersion({versionId:control.versionId}).then(function(info){
                    expect(info).to.eql(control);
                });
            })
            .then(function(){
                version.versionId = control.versionId;
                version.stamp += 100000;
                version.metadataId = 324;
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
                contentId: contentId,
                diffId: diffId
            };
            let revId;
            return Promise.resolve()
            .then(function(){
                return that.store.storeRevisionInfo(revInfo).then(function(info){
                    expect(!!info).to.be(true);
                    expect(!!info.revisionId).to.be(true);
                    revId = info.revisionId;
                    expect(info.length).to.eql(revInfo.length);
                    expect(info.hash).to.eql(revInfo.hash);
                    expect(info.contentId).to.eql(revInfo.contentId);
                    expect(info.diffId).to.eql(revInfo.diffId);
                });
            })
            .then(function(){
                return that.store.loadRevisionInfo({revisionId:revId}).then(function(info){
                    expect(!!info).to.be(true);
                    expect(info.revisionId).to.eql(revId);
                    expect(info.length).to.eql(revInfo.length);
                    expect(info.hash).to.eql(revInfo.hash);
                    expect(info.contentId).to.eql(revInfo.contentId);
                    expect(info.diffId).to.eql(revInfo.diffId);
                });
            })
            .then(function(){
                return that.store.loadRevisionInfoByHash({hash:hash}).then(function(info){
                    expect(!!info).to.be(true);
                    expect(info.revisionId).to.eql(revId);
                    expect(info.length).to.eql(revInfo.length);
                    expect(info.hash).to.eql(revInfo.hash);
                    expect(info.contentId).to.eql(revInfo.contentId);
                    expect(info.diffId).to.eql(revInfo.diffId);
                });
            });
        });
    }
    
    _testPaths() {
        let that = this;
        that._write('should store/read paths', function(){
            let paths = ['foo/bar/file.doc', 'foo/bar/toto.pdf', 'foo/about.md'];
            let pathIds;
            let pathIndex;
            return Promise.resolve()
            .then(function(){
                return that.store.storePaths({paths}).then(function(info){
                    expect(!!info).to.be(true);
                    let testPaths = Object.keys(info).sort();
                    expect(testPaths).to.eql(paths.sort());
                    pathIds = testPaths.map(function(path){
                        return info[path];
                    });
                    pathIndex = info;
                });
            })
            .then(function(){
                return that.store.loadPaths({paths}).then(function(info){
                    expect(info).to.eql(pathIndex);
                });
            })
            .then(function(){
                return that.store.loadPaths({pathIds}).then(function(info){
                    expect(info).to.eql(pathIndex);
                });
            });
        });
    }
    
    _testBlobs(){
        let that = this;
        that._write('should store / load blobs', function(){
            let str = 'This is a content';
            let content = new Buffer(str, 'UTF-8');
            let hash = Digest.digest(content);
            let blobId;
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
                expect(!!info.blobId).to.be(true);
                blobId = info.blobId;
            })
            
            // Load blob by id
            .then(function(){
                return that.store.loadBlob({blobId});
            }).then(function(info){
                expect(info.hash).to.eql(hash);
                expect(info.blobId).to.eql(blobId);
                expect(!!info.content).to.be(true);
                expect(Digest.digest(info.content)).to.eql(hash);
                expect(info.content.toString()).to.eql(str);
            })
            
            // Delete blob
            .then(function(info){
                return that.store.deleteBlob({blobId});
            }).then(function(){
                return that.store.loadBlob({blobId});
            }).then(function(info){
                expect(info).to.be(undefined);
            });
        });
    }
    
}

