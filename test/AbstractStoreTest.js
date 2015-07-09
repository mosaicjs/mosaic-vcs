import expect from 'expect.js';

export default class AbstractStoreTest {
    
    constructor(options){
        options = options || {};
        this.newStore = options.newStore;
        this.deleteStore = options.deleteStore;
    }
    
    static run(options){
        let Type = this;
        let test = new Type(options);
        test.run();
    }

    run(){
        let that = this;
        before(function(done){
            Promise.resolve().then(function(){
                return that.newStore();
            }).then(function(store){
                that.store = store;
                return that.onOpen(that.store);
            }).then(done, done);
        });
        after(function(done){
            let error;
            Promise.resolve().then(function(){
                return that.onClose(that.store);
            }).then(null, function(err){
                error = err;
            }).then(function(){
                return that.deleteStore(that.store);
            }).then(function(){
                delete that.model;
                delete that.store;
                if (error) throw error;
            }).then(done, done);
        });
        this.testAll();
    }
    
    onOpen(store) {
    	return store.open();
    }
    
    onClose(store) {
    	return store.close();
    }
    
    testAll() { throw new Error('Not implemented'); }
    
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
    
    _newContentRevisions(count, minLength, maxLength){
        let buffers = [];
        let len = Math.round(minLength + Math.random()*(maxLength - minLength));
        let base = new Buffer(len);
        this._newRandomValues(base);
        for (let i = 0; i < count; i++) {
            let buf = new Buffer(len);
            buf.copy(base, 0, 0, len);
            let start = len / 4;
            let from = Math.round(Math.random() * start);
            let to = from + Math.round(Math.random() * (len - from - start));
            this._newRandomValues(buf, from, to);
            buffers.push(buf);
        }
        return buffers;
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

