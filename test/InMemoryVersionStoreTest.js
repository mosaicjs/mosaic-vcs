import expect from 'expect.js';
import { MemoryVersionStore } from '../';
import VersionStoreTestLib from './VersionStoreTestLib';

describe('InMemoryVersionStore', function(){
    let options = {};
    new VersionStoreTestLib({
        newStore : function() { return new MemoryVersionStore(options); },
        deleteStore : function(store) { }
    }).run();
});

