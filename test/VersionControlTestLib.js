import expect from 'expect.js';
import { VersionControl } from '../';

export default class VersionControlTestLib {
    
    constructor(options){
        options = options || {};
        this.store = options.store;
        this.name = options.name;
    }

    run(){
        let that = this;
        before(function(done){
            that.vc = new VersionControl({store: that.store});
            that.vc.open().then(done, done);
        });
        after(function(done){
            that.vc.close().then(done, done);
        });
        it('should be able to create a new project', function(done) {
            that.vc.createProject()
            .then(function(r){
                console.log(r);
            })
            .then(done, done);
        });
    }
    
}

