import expect from 'expect.js';
import vc from '../';
let Digest = vc.utils.Digest;
import AbstractStoreTest from './AbstractStoreTest';

export default class VcBlobTest extends AbstractStoreTest {

    testAll(){
        describe('Blob', this._testBlob.bind(this));
    }
    
    _testBlob() {
        let that = this;
        that._test('should accept empty content', function(){
            let blob = new vc.Blob({ store:that.store });
            return Promise.resolve().then(function(){
                return blob.loadContent()
                .then(function(content){
                    expect(!!content).to.be(true);
                    expect(content.length).to.eql(0);
                    expect(Digest.digest(content)).to.eql(vc.Blob.EMPTY_HASH);
                    expect(content).to.eql(vc.Blob.EMPTY_BUFFER);
                });
            }).then(function(){
                return blob.loadMetadata()
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
            
            let empty = new vc.Blob({store: that.store});
            return empty.newBlob({content:first})
            .then(function(firstBlob){
                return that._testBlobContent(firstBlob, first, {
                    hash: firstHash,
                    length : first.length
                }).then(function(secondBlob){
                    return firstBlob.newBlob({content:second})
                    .then(function(secondBlob) {
                        return that._testBlobContent(secondBlob, second, {
                            hash: secondHash,
                            length : second.length
                        })
                    })
                });
            });
        });

        let count = 40;
        let minLength = 250;
        let maxLength = 1000;
        let buffers = that._newContentRevisions(count, minLength, maxLength);
        let blobs = [];
        that._test('should be able to store multiple resource revisions', function() {
            let blob = new vc.Blob({store: that.store});
            let promise = Promise.resolve();
            buffers.map(function(buf){
                promise = promise.then(function(){
                    return blob.newBlob({ content: buf }).then(function(b){
                        blob = b;
                        blobs.push(b);
                        return b.loadContent().then(function(content){
                            expect(buf.length).to.eql(content.length);
                            expect(Digest.digest(buf)).to.eql(Digest.digest(content));
                            return b.loadMetadata().then(function(meta){
                                expect(!!meta).to.be(true);
                                expect(Digest.digest(buf)).to.eql(meta.hash);
                                expect(buf.length).to.eql(meta.length);
                            });
                        });
                    });
                });
            });
            return promise;
        });
        that._test('should be able to load and check resource revisions', function(){
            return Promise.all(buffers.map(function(buf, i) {
                let b = blobs[i];
                return that._testBlobContent(b, buf, {
                    hash: Digest.digest(buf),
                    length : buf.length
                });
            }));
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

