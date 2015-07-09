var expect = require('expect.js');
require('babel/register');
require('./BinDeltaTest');

//---------------------------------------------------------------------------

function testAll(storeProvider){
    describe('Store', function(){
        require('./VersionStoreTest').run(storeProvider('VersionStoreTest'));
    });
    describe('Model', function() {
        require('./VcBlobTest').run(storeProvider('VcBlobTest'));
        require('./VcRevisionTest').run(storeProvider('VcRevisionTest'));
    });
}

// ---------------------------------------------------------------------------
// In memory tests
describe('MemoryVersionStore', function() {
    var vc = require('../');
    testAll(function(name){
        return {
            newStore : function() {
                return new vc.store.MemoryVersionStore({});
            },
            deleteStore : function(store) {
            }
        }; 
    });
});

// ---------------------------------------------------------------------------
// Sqlite store

describe('SqliteVersionStore', function() {
    var Promise = require('promise');
    var FS = require('fs');
    var vc = require('../');
    testAll(function(name){
        var url = __dirname + '/' + name + '.db';
        try {
            FS.unlinkSync(url);
        } catch (err) {
        }
        return {
            newStore : function() {
                return remove(url).then(function() {
                    return new vc.store.SqliteVersionStore({
                        url : url
                    });
                });
            },
            deleteStore : function(store) {
                return remove(url);
            }
        };
    });

    function remove(path) {
        return new Promise(function(resolve, reject) {
            if (FS.existsSync(path)) {
                FS.unlink(path, function(err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
});


