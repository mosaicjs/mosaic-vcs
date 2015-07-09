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
    get(sql, ...params){ return this._exec(this.db, 'get', ...arguments); }
    run(sql, ...params){ return this._exec(this.db, 'run', ...arguments); }
    all(sql, ...params) { return this._exec(this.db, 'all', ...arguments); }
    each(sql, ...params) { return this._exec(this.db, 'each', ...arguments); }
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
        return this.transaction(method, ...params);
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
            that.db[name](function(){
               return Promise.resolve().then(function(){
                   return method.call(that, ...params);
               }).then(resolve, reject);
            });
        });
    }
    transaction(method, ...params) {
        let that = this;
        function startTransaction(){
            that._transactionCounter = that._transactionCounter || 0;
            let start = (that._transactionCounter === 0);  
            that._transactionCounter++;
            if (start) {
                that._commit = true;
                return that.run('begin transaction');
            } else {
                return Promise.resolve();
            }
        }
        function endTransaction(ok){
            that._transactionCounter--;
            that._commit &= ok;
            if (that._transactionCounter === 0) {
                if (that._commit){
                    return that.run('commit transaction');
                } else {
                    return that.run('rollback transaction');
                }
            } else {
                return Promise.resolve();
            }
        }
        return Promise.resolve()
        .then(startTransaction)
        .then(function(){
            return (method.bind(that))(...params);
        })
        .then(function(result){
            return endTransaction(true).then(function(){
                return result;
            });
        }, function(err) {
            return endTransaction(false).then(function(){
                throw err;
            });
        })
    }
    
    _exec(obj, method, ...params) {
        return new Promise(function(resolve, reject){
            try {
               obj[method](...params, function(err, result){
                   if (err) reject(err);
                   else {
                       let r = this || {};
                       r.result = result;
                   	   resolve(r);
                   }
               });
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


