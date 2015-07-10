import Promise from 'promise';
import sqlite3 from 'sqlite3';
sqlite3.verbose();

export default class SqliteStore {
    
    constructor(options){
        this.options = options || {};
    }

    open(){
        return new Promise(function(resolve, reject) {
            let url = this.options.url || ':memory:';
            this.db = new sqlite3.Database(url, function(err){
                if (err) reject(err);
                else resolve();
            });
        }.bind(this)).then(function(){
            return this.onOpen();
        }.bind(this));
    }
    
    close(){
        let that = this;
        return Promise.resolve().then(function(){
            return that.onClose();
        }).then(function(){
        }, function(err){
            console.log(err);
        }).then(function(){
            return new Promise(function(resolve, reject){
                try {
                    that.db.close(function(err){
                        delete that.db;
                        if (err) reject(err);
                        else resolve();
                    });
                } catch (err){
                    reject(err);
                }
            });
        });
    }

    onOpen(){}

    onClose(){}
    
    // exec(sql, ...params){ return this._exec(this.db, 'exec', ...arguments); }
    get(sql, ...params){ return this._exec('get', ...arguments); }
    run(sql, ...params){ return this._exec('run', ...arguments); }
    all(sql, ...params) { return this._exec('all', ...arguments); }
    each(sql, ...params) { return this._exec('each', ...arguments); }
    prepare(sql, method) {
        let that = this;
        let args = Array.prototype.slice.call(arguments);
        method = args.pop();
        return new Promise(function(resolve, reject) {
            var stmt = that.db.prepare.apply(that.db, args);
            function finalize(err){
                try {
                    stmt.finalize(function(err){
                        if (err) reject(err);
                        else resolve();
                    });
                } catch (err) {
                    reject(err);
                }
            }
            return Promise.resolve().then(function(){
                return method.call(that, stmt);
            }).then(finalize, finalize);
        })
    }

    readTransaction(method, ...params) {
        let that = this;
        return Promise.resolve().then(function(){
            return (method.bind(that))(...params);
        });
    }
    writeTransaction(method, ...params) {
        return this.transaction(method, ...params);
    }
    
    serialize(method, ...params){
        return this._mode('serialize', method, ...params);
    }
    parallelize(method, ...params){
        return this._mode('parallelize', method, ...params);
    }
    _mode(name, method, ...params) {
        let that = this;
        return new Promise(function(resolve, reject) {
               return Promise.resolve().then(function(){
                   that.db[name](function(){
                       return method.call(that, ...params);
                   });
               }).then(resolve, reject);
        });
    }
    wrap1(before, after, onError){
        let promise; 
        return function(action){
            if (!promise) {
                promise = Promise.resolve();
            }
            let local = promise = promise
            .then(function(){ return before(); })
            .then(function(){ return action(); })
            .then(function(r){
                return Promise.resolve().then(function(){
                    return after(r);
                }).then(function(){ return r; }, function(){ return r; });
            }, function(err) {
                return Promise.resolve().then(function(){
                    return onError(err);
                }).then(function(){ throw r; }, function(){ return r; });
            });
            return local.then(function(result){
                if (local === promise) { promise = null; }
                return result;
            }, function(err) {
                if (local === promise) { promise = null; }
                throw err;
            });
        };
    }
    wrap(before, after, onError){
        let counter = 0;
        return function(action){
            return Promise.resolve().then(function(){
                counter++;
                if (counter === 1) {
                    return before();
                }
            }).then(function(){
                return action();
            }).then(function(result){
                counter--;
                if (counter === 0) {
                    return Promise.resolve().then(after).then(function(){
                        return result;
                    });
                }
                return result;
            }, function(err) {
                counter--;
                if (counter === 0) {
                    return Promise.resolve().then(after).then(function(){
                        throw err;
                    });
                }
                throw err;
            });
        };
    }    
    transaction(method, ...params) {
        let that = this;
        return Promise.resolve().then(function(){
            return (method.bind(that))(...params);
        });
        
        if (!that._transactionWrapper) {
            that._transactionWrapper = that.wrap(
                function(){ return that.run('BEGIN TRANSACTION'); },
                function(){ return that.run('COMMIT TRANSACTION'); },
                function(err){ return that.run('ROLLBACK TRANSACTION'); }
            ); 
        }
        return that._transactionWrapper(function(){
            return (method.bind(that))(...params);
        });
    }

    _exec(method, ...params) {
        let that = this;
        return new Promise(function(resolve, reject){
            try {
//                that.db.serialize(function(){
                    that.db[method](...params, function(err, result){
                        if (err) reject(err);
                        else {
                            let r = this || {};
                            r.result = result;
                            resolve(r);
                        }
                    });
//                });
            } catch (err){
                reject(err);
            }
        });
    }
    
    _toSqlParams(obj){
        let result = {};
        Object.keys(obj).forEach(function(key){
            result['$' + key] = obj[key];
        })
        return result;
    }
    
    static addTo(Type){
        let that = this;
        Objects.keys(that.prototype).forEach(function(key){
            Type.prototype[key] = that.prototype[key];
        });
    }
    
}


