import expect from 'expect.js';
import vc from '../';
let Digest = vc.utils.Digest;
import AbstractStoreTest from './AbstractStoreTest';

export default class VcRevisionTest extends AbstractStoreTest {

    testAll(){
        describe('Revision', this._testRevision.bind(this));
    }
    
    _testRevision() {
        let that = this;
        that._test('should create empty revisions', function(){
            let path = 'path/to/my/resource.json';
            let rev = new vc.Revision({
                store: that.store,
                path : path
            });
            expect(rev.pid).to.eql(0);
            expect(rev.path).to.eql(path);
            return rev.blob.loadContent()
            .then(function(content){
                expect(!!content).to.be(true);
                expect(content.length).to.eql(0);
                expect(Digest.digest(content)).to.eql(vc.Blob.EMPTY_HASH);
                expect(content).to.eql(vc.Blob.EMPTY_BUFFER);
            }).then(function(){
                return rev.blob.loadMetadata()
                .then(function(meta){
                    expect(!!meta).to.be(true);
                    expect(meta.hash).to.eql(vc.Blob.EMPTY_HASH);
                    expect(meta.length).to.be(0);
                    expect(meta.content).to.be(0);
                    expect(meta.diff).to.be(0);
                });
            });
        });
    
        that._test('should be able to store new resource revisions', function() {
            let len = 10000;
            let first = new Buffer(len);
            that._newRandomValues(first);
            let second = new Buffer(first.length);
            first.copy(second, 0, 0, first.length);
            that._newRandomValues(second, second.length * 1 / 5, second.length * 2 / 5);
            let firstHash = Digest.digest(first);
            let secondHash = Digest.digest(second);
            expect(firstHash).to.not.eql(secondHash);
            
            let path = 'path/to/my/resource.json';
            let empty = new vc.Revision({
                store: that.store,
                path : path
            });
            let rev1;
            return Promise.resolve().then(function(){
                return empty.newRevision(first).then(function(rev){
                    expect(rev.pid > 0).to.be(true);
                    expect(rev.path).to.eql(path);
                    rev1 = rev;
                    return that._testBlobContent(rev.blob, first, {
                        hash: firstHash,
                        length : first.length
                    });
                })
            })
            .then(function(){
                return rev1.newRevision(second).then(function(rev){
                    expect(rev.pid).to.eql(rev1.pid);
                    expect(rev.path).to.eql(path);
                    return that._testBlobContent(rev.blob, second, {
                        hash: secondHash,
                        length : second.length
                    });
                });
            });
        });
    }
    
    _testBlobContent(blob, content, meta) {
        return Promise.resolve()
        .then(function(){
            return blob.loadContent()
            .then(function(test){
                expect(test.length).to.eql(meta.length);
                expect(Digest.digest(test)).to.eql(meta.hash);
                expect(test.toString('hex')).to.eql(content.toString('hex'));
            });
        })
        .then(function(){
            return blob.loadMetadata()
            .then(function(test){
                expect(test.length).to.eql(meta.length);
                expect(test.hash).to.eql(meta.hash);
            });
        });
    }
    
}

