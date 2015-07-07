import expect from 'expect.js';
import vc from '../';
import VersionStoreTestLib from './VersionStoreTestLib';
import FS from 'fs';
import Promise from 'promise';

describe('SqliteVersionStore', function(){
    let url = __dirname + '/SqliteVersionStore.db';
    try{FS.unlinkSync(url);} catch (err) {}
    new VersionStoreTestLib({
        newStore : function() {
            return remove(url).then(function(){
                return new vc.store.SqliteVersionStore({url});
            });
        },
        deleteStore : function(store) {
            return remove(url);
        }
    }).run();
});

function remove(path){
    return new Promise(function(resolve, reject) {
       FS.unlink(path, function(err) {
           resolve();
       });
    });
} 