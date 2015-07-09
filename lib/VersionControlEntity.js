export default class VersionControlEntity {
    constructor(options){
        this.options = options || {};
        this.store = this.options.store;
    }
}
