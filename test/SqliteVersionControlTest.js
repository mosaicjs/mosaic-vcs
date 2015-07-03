import expect from 'expect.js';
import { SqliteVersionStore } from '../';
import VersionControlTestLib from './VersionControlTestLib';

describe('SqliteVersionControl', function(){
    let url = __dirname + '/SqliteVersionControl.db';
    try{FS.unlinkSync(url);} catch (err) {}

    new VersionControlTestLib({
        store : new SqliteVersionStore({url})
    }).run();
});

