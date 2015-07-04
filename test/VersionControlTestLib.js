import expect from 'expect.js';
import { VersionControl, Digest } from '../';

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
                that.vc = new VersionControl({store: store});
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
        this._testResourceRevisions();
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
                    base : firstHash,
                    content: second
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

