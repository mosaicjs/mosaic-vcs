import expect from 'expect.js';
import { MemoryVersionStore } from '../';
import VersionControlTestLib from './VersionControlTestLib';

describe('InMemoryVersionControl', function(){
    let options = {};
    new VersionControlTestLib({
        store : new MemoryVersionStore(options)
    }).run();
});

