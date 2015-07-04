import expect from 'expect.js';
import FS from 'fs';
import { SqliteVersionStore } from '../';
import VersionControlTestLib from './VersionControlTestLib';

describe('SqliteVersionControl', function(){
    let url = __dirname + '/SqliteVersionControl.db';
    try{FS.unlinkSync(url);} catch (err) {}
    new VersionControlTestLib({
        newStore : function() {
            return remove(url).then(function(){
                return new SqliteVersionStore({url});
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