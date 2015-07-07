import expect from 'expect.js';
import vc from '../';
import VersionStoreTestLib from './VersionStoreTestLib';

describe('InMemoryVersionStore', function(){
    let options = {};
    new VersionStoreTestLib({
        newStore : function() { return new vc.store.MemoryVersionStore(options); },
        deleteStore : function(store) { }
    }).run();
});

