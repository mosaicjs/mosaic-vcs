import expect from 'expect.js';
import vc from '../';
let Digest = vc.utils.Digest;

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
                that.vc = new vc.VersionControl({store: store});
                return that.vc.open();
            }).then(done, done);
        });
        after(function(done){
            let error;
            Promise.resolve().then(function(){
                return that.vc.close();  
            }).then(null, function(err){
                error = err;
            }).then(function(){
                return that.deleteStore(that.vc.store);
            }).then(function(){
                delete that.vc;
                if (error) throw error;
            }).then(done, done);
        });
        this._testVersions();
        this._testResourceRevisions();
    }
    
    _testVersions(){
        let that = this;
        function compareKeys(first, second){
            let firstKeys = Object.keys(first).sort();
            let secondKeys = Object.keys(second).sort();
            expect(firstKeys).to.eql(secondKeys);
        }
        that._test('should add multiple resources to a version', function() {
            let count = 100;
            let minLength = 50;
            let maxLength = 10000;
            
            let paths = that._newRandomPaths(count);
            let resourceOptions = {
                paths: paths,
                count : paths.length * 3 / 4,
                minLength,
                maxLength
            };
            let firstResources = that._newResources(resourceOptions);
            let secondResources = that._newResources(resourceOptions);
            let combinedResources = {};
            Object.keys(firstResources).concat(Object.keys(secondResources))
                .forEach(function(path){
                combinedResources[path] = secondResources[path] || firstResources[path];
            });
            
            let versionId = '';
            return that.vc.newVersion({
                base:undefined // create a new root version 
            }).then(function(version) {
                expect(!!version).to.be(true);
                expect(!!version.id).to.be(true);
                // Version is not commited
                expect(version.hash).to.be(undefined); 
                expect(version.isCommited()).to.be(false);
                
                // Should return an empty mapping between paths 
                // and the corresponding revision info objects. 
                return version.loadRevisionsInfo()
                .then(function(revisions){
                    // Empty resources set
                    expect(revisions).to.eql({});
                    return version.addResources({resources:firstResources});
                })
                .then(function(revisions){
                    // Revisions of all added resources
                    expect(Object.keys(revisions).length)
                        .to.eql(Object.keys(firstResources).length);
                    // Load resources
                    return version.loadResources().then(function(storedResources){
                        compareKeys(storedResources, firstResources);
                    });
                })
                .then(function(){
                    return version.addResources({resources:secondResources});
                })
                .then(function(revisions){
                    // Revisions of all added resources
                    expect(Object.keys(revisions).length)
                        .to.eql(Object.keys(combinedResources).length);
                    // Load resources
                    return version.loadResources().then(function(storedResources){
                        compareKeys(storedResources, combinedResources);
                    });
                });
            });
            
//            let branch = 'foo';
//            return that.vc.loadBranch({branch}).then(function(branch){
//                if (branch) 
//                    return branch;
//                return that.vc.createBranch({
//                    branch, // branch name
//                    parent: undefined // hash of the parent version
//                });
//            }).then(function(branch){
//                return Promise.resolve(){
//                    return branch.loadResources().then(function(revisions){
//                        // should return all revisions from the parent version
//                    });    
//                })
//                .then(function()){
//                    return branch.storeResources({resources}).then(function(revisions){
//                        // should return merged list of old and new revisions
//                    });    
//                }
//                .then(function()){
//                    return branch.removeResources({resources}).then(function(revisions){
//                        // should return merged list of old and new revisions
//                    });    
//                }
//                // Creates new revisions based on the parent revisions
//                // Newly added resources replaces already defined non-commited revisions
//                
//                return branch.storeResources({ resources })
//                .then(function(){
//                    branch.removeResources()
//                });
//            })
            // * get a branch (create = true/false) 
            // - onCreate: takes all resource revisions from the parent revision 
            // * add resources to the branch
            // - creates new resource revisions and adds them to the version
            // * merge with branch(-es)
            // - takes resources in the order by their paths and merge lists
            // - conflict: if there are more than 2 different revisions of the same resource 
            // .. one revision is a parent of other => automatic resolve (more recent)
            // .. there is a common parent => conflict with the parent as a base 
            // .. there is no common parents => conflict without common parents
            // * commit
            // - 
            
            return that.vc.createVersion({
                parents : [],
                resources : resources
            }).then(function(){
                
            });
            return that.vc.storePaths(paths).then(function(pathIndex){
                console.log('PATHS:', pathIndex)
            });
        });
    }

    _testResourceRevisions(){
        let that = this;
        that._test('should be able to store a new resource revision', function() {
            let len = 10000;
            let first = new Buffer(len);
            this._newRandomValues(first);
            let second = new Buffer(first.length);
            first.copy(second, 0, 0, first.length);
            this._newRandomValues(second, second.length * 1 / 5, second.length * 2 / 5);
            let firstHash = Digest.digest(first);
            let secondHash = Digest.digest(second);
            expect(firstHash).to.not.eql(secondHash);
            
            return that.vc.storeResourceRevision({content:first})
            .then(function(info){
                expect(info.hash).to.eql(firstHash);
                return that.vc.storeResourceRevision({
                    content: second,
                    base : info.id
               }).then(function(info){
                   expect(info.hash).to.eql(secondHash);
               });
            })
            .then(function(){
                return that.vc.loadResourceRevision({hash:firstHash})
                .then(function(result){
                    expect(result.hash).to.eql(firstHash);
                    expect(Digest.digest(result.content)).to.eql(firstHash);
                    expect(result.content.toString('hex')).to.eql(first.toString('hex'));
                });
            })
            .then(function(){
                return that.vc.loadResourceRevision({hash:secondHash})
                .then(function(result){
                    expect(result.hash).to.eql(secondHash);
                    expect(Digest.digest(result.content)).to.eql(secondHash);
                    expect(result.content.toString('hex')).to.eql(second.toString('hex'));
                });
            });
        });

        that._test('should be able to store multiple resource revisions', function() {
            let count = 30; // Number of revisions
            let len = 10000; // Length of the resource
            let first = new Buffer(len);
            this._newRandomValues(first);
            let list = [first];
            while (list.length < count) {
                let prev = list[list.length - 1];
                let buf = new Buffer(first.length);
                prev.copy(buf, 0, 0, prev.length);
                let from = Math.round(Math.random() * buf.length * 1 / 4 );
                let to = from + Math.round(Math.random() * buf.length * 3 / 4);
                this._newRandomValues(buf, from, to);
                list.push(buf);
            }
            let hashes = list.map(function(buf){
                return Digest.digest(buf);
            });
            let promise = Promise.resolve();
            let base;
            list.forEach(function(buf, i){
                promise = promise.then(function(){
                    return that.vc.storeResourceRevision({
                        base : base,
                        content:buf
                    }).then(function(info){
                        expect(info.hash).to.eql(hashes[i]);
                        base = info.hash;
                    });
                });
            });
            promise.then(function(){
                return Promise.all(hashes.map(function(hash, i){
                    return that.vc.loadResourceRevision({hash})
                        .then(function(result){
                            expect(result.hash).to.eql(hash);
                            expect(Digest.digest(result.content)).to.eql(hash);
                            let buf = list[i];
                            expect(result.content.toString('hex')).to.eql(buf.toString('hex'));
                        });
                }));
            });
            return promise;
        });
    }
    
    _newRandomValues(buffer, from, to){
        from = Math.round(from || 0);
        to = to || buffer.length - 1;
        to = Math.max(0, Math.min(buffer.length - 1, to));
        for (let i = from; i <= to; i++) {
            buffer[i] = Math.round(255 * Math.random());
        }
        return buffer;
    }
    
    _newRandomPaths(count, depth, pathLen){
        depth = depth || 5;
        let letters = 'abcdefghijklmnopqrstuvxyz';
        pathLen = pathLen || 100;
        function rnd(len) {
            return 1 + Math.round(Math.random() * (len - 1));
        }
        let segments = [];
        let segmentsNum = Math.floor(count / depth);
        let segmentLen = 1 + Math.ceil(pathLen / depth);
        let charCounter = 0;
        for (let i=0; i<depth; i++){
            let list = segments[i] = [];
            for (let j=0, jl=rnd(segmentsNum); j<jl; j++){
                let segment = '';
                for (let k=0, kl = rnd(segmentLen); k<kl; k++){
                    segment += letters[rnd(letters.length) - 1];
                }
                list.push(segment);
            }
        }
        let result = {};
        let segmentCounter = 0;
        while (Object.keys(result).length < count){
            let path = [];
            for (let j=0, jl=rnd(segments.length); j<jl; j++) {
                let list = segments[j];
                let segment = list[segmentCounter % list.length];
                segmentCounter++;
                path.push(segment);
            }
            result[path.join('/')] = true;
        }
        return Object.keys(result).sort();
    }
    
    _newResources(options){
        let paths = options.paths;
        let count = options.count;
        let minLength = options.minLength;
        let maxLength = options.maxLength;
        let resources = {};
        while (Object.keys(resources).length < count) {
            let i = Math.round(Math.random() * paths.length);
            let path = paths[i];
            resources[path] = null;
        }
        for (let path in resources){
            let len = Math.round(minLength + Math.random()*(maxLength - minLength));
            let buf = new Buffer(len);
            this._newRandomValues(buf);
        }
        return resources;
    }
    
    _test(msg, f){
        let that = this;
        it(msg, function(done){
            Promise.resolve().then(function(){
                return f.apply(that);
            })
            .then(function(){})
            .then(done, done);
        })
    }
    
}

