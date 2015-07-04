import expect from 'expect.js';
import { MemoryVersionStore } from '../';
import VersionControlTestLib from './VersionControlTestLib';

describe('InMemoryVersionControl', function(){
    let options = {};
    new VersionControlTestLib({
        newStore : function() { return new MemoryVersionStore(options); },
        deleteStore : function(store) { }
    }).run();
});

