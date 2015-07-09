var expect = require('expect.js');
require('babel/register');
require('./BinDeltaTest');

//---------------------------------------------------------------------------

function testAll(storeProvider){
    describe('Store', function(){
        require('./VersionStoreTest').run(storeProvider);
    });
    describe('Model', function() {
        require('./VcBlobTest').run(storeProvider);
    });
}

// ---------------------------------------------------------------------------
// In memory tests
describe('MemoryVersionStore', function() {
    var vc = require('../');
    testAll({
        newStore : function() {
            return new vc.store.MemoryVersionStore({});
        },
        deleteStore : function(store) {
        }
    });
});

// ---------------------------------------------------------------------------
// Sqlite store

describe('SqliteVersionStore', function() {
    var url = __dirname + '/SqliteVersionStore.db';
    var Promise = require('promise');
    var FS = require('fs');
    var vc = require('../');
    try {
        FS.unlinkSync(url);
    } catch (err) {
    }
    testAll({
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
    });

    function remove(path) {
        return new Promise(function(resolve, reject) {
            FS.unlink(path, function(err) {
                resolve();
            });
        });
    }
});


