import expect from 'expect.js';
import vc from '../';
import VersionControlTestLib from './VersionControlTestLib';

describe('InMemoryVersionControl', function(){
    let options = {};
    new VersionControlTestLib({
        newStore : function() { return new vc.store.MemoryVersionStore(options); },
        deleteStore : function(store) { }
    }).run();
});

