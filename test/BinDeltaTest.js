import FS from 'fs';
import expect from 'expect.js';
import { BinDelta, Digest } from '../';

describe('BinDelta', function(){
    
    it('should create a binary delta object', function(){
        let firstFile = __dirname + '/BinDeltaTest-lorem.1.txt';
        let secondFile = __dirname + '/BinDeltaTest-lorem.2.txt';
        let deltaFile = __dirname + '/BinDeltaTest-lorem.bindiff';

        let first = FS.readFileSync(firstFile);
        let second  = FS.readFileSync(secondFile);
        let patch = testDiff(first, second);
        if (deltaFile){
            FS.writeFileSync(deltaFile, patch);
        }
    });

    it('should generate diffs for non-intialized buffers', function(){
        let first = new Buffer(1000 * 1000 * 2);
        let second = new Buffer(first.length);
        first.copy(second, 0, 0, first.length);
        testDiff(first, second);
     });
    
    it('should generate diffs for buffers without modifications', function(){
        let first = new Buffer(1000 * 1000 * 2);
        newRandomValues(first);
        let second = new Buffer(first.length);
        first.copy(second, 0, 0, first.length);
        testDiff(first, second);
     });
    
    it('should generate diffs for random data', function(){
       let first = new Buffer(1000 * 1000 * 2);
       newRandomValues(first);
       let second = new Buffer(first.length);
       first.copy(second, 0, 0, first.length);
       // Artificially change 2/5 of the length
       newRandomValues(second, second.length * 1 / 5, second.length * 2 / 5);
       newRandomValues(second, second.length * 3 / 5, second.length * 4 / 5);
       testDiff(first, second);
    });
    
    
    function testDiff(first, second){
        let firstHash = Digest.digest(first);
        let secondHash = Digest.digest(second);
        let patch = BinDelta.diff(first, second);
        expect(!!patch).to.be(true);
        let patchHash = Digest.digest(patch);
        expect(patchHash).to.not.eql(firstHash);
        expect(patchHash).to.not.eql(secondHash);
        let test = BinDelta.patch(first, patch);
        let testHash = Digest.digest(test);
        expect(testHash).to.eql(secondHash);
        return patch;
    }
    
    function newRandomValues(buffer, from, to){
        from = Math.round(from || 0);
        to = to || buffer.length - 1;
        to = Math.max(0, Math.min(buffer.length - 1, to));
        for (let i = from; i <= to; i++) {
            buffer[i] = Math.round(255 * Math.random());
        }
        return buffer;
    }
});
