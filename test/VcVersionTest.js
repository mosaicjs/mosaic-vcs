import expect from 'expect.js';
import vc from '../';
let Digest = vc.utils.Digest;
import AbstractStoreTest from './AbstractStoreTest';

export default class VcVersionTest extends AbstractStoreTest {

    testAll(){
        describe('Version', this._testVersion.bind(this));
    }
    
    _testVersion() {
        let that = this;
        that._test('should return a non-empty metadata object', function(){
            let version = new vc.Version({store:this.store});
            return version.loadMetadata().then(function(meta){
                expect(!!meta).to.be(true);
                expect(!!meta.versionId).to.be(true);
                expect(meta.versionId > 0).to.be(true);
            }).then(function(){
                return version.loadRevisions().then(function(revs){
                    expect(!!revs).to.be(true);
                    expect(revs).to.eql([]);
                });
            });
        });
        
        let resources = {
            'info' : { msg: 'Hello, world!' },
            // Binary data
            'info/image.jpg' : new Buffer([123, 23, 89, 97, 78] ), 
            'info/title' : 'We are a super-company!',
            'info/description' : 'Blah-bla-blah...',
            'about/team.md' : 'We are a small team of professionals... Blah-blah-blah...',
            'about/team/Jonh' : { firstName : 'John', lastName: 'Smith', age: 39 },
        }; 
        that._test('should be able to build revisions without storing them', function(){
            let version = new vc.Version({store:this.store});
            return version.buildRevisions({resources})
            .then(function(revisions){
                return compareResourceRevisions(resources, revisions);
            })
            .then(function(){
                return version.loadRevisions().then(function(revisions){
                    return compareResourceRevisions([], []);
                });
            });
        });

        that._test('should be able to build, store and load revisions', function(){
            let version = new vc.Version({store:this.store});
            return version.buildRevisions({resources})
            .then(function(revisions){
                return version.storeRevisions({revisions});
            }).then(function(revisions){
                return compareResourceRevisions(resources, revisions);
            })
            .then(function(){
                return version.loadRevisions().then(function(revisions){
                    return compareResourceRevisions(resources, revisions);
                });
            });
        });

        that._test('should be able to build, store and load revisions', function(){
            let resources1 = {
                'first': 'First',
                'second' : 'Second',
                'third' : 'Third',
                'fourth' : 'Fourth'
            }
            let resources2 = {
                'first': 'First ABC',
                'second' : 'Second',
                'third' : 'Third CDE',
                'fourth' : 'XYZ Fourth'
            };

            let version1 = new vc.Version({store:this.store});
            let version2;
            return Promise.resolve().then(function(){
                return version1.storeResources({
                    resources : resources1
                }).then(function(revisions){
                    return compareResourceRevisions(resources1, revisions);
                });
            })
            .then(function(){
                return version1.createChildVersion().then(function(ver){
                    version2 = ver;
                    expect(!!version2).to.eql(true);
                    return version2.storeResources({
                        resources : resources2
                    }).then(function(revisions){
                        return compareResourceRevisions(resources2, revisions);
                    }).then(function(){
                        return version2.loadRevisions().then(function(revisions){
                            return compareResourceRevisions(resources2, revisions);
                        });
                    });
                });
            })
            .then(function(){
                return version1.loadRevisions().then(function(revisions){
                    return compareResourceRevisions(resources1, revisions);
                }).then(function(){
                    return version2.loadRevisions().then(function(revisions){
                        return compareResourceRevisions(resources2, revisions);
                    });
                });
            });
        });
    }
    
}

function compareResourceRevisions(resources, revisions){
    function compare(content, blob){
        return blob.loadContent().then(function(buf){
            let first, second;
            if (Buffer.isBuffer(content)){
                first = content.toString('hex');
                second = buf.toString('hex');
            } else {
                first = JSON.stringify(content);
                second = buf.toString();
            }
            expect(first).to.eql(second);
        });
    }
    let paths = Object.keys(resources).sort();
    expect(revisions.length).to.eql(paths.length);
    return Promise.all(revisions.map(function(rev, i){
        let path = paths[i];
        expect(rev.path).to.eql(path);
        let content = resources[path];
        return compare(content, rev.blob);
    }));
}
