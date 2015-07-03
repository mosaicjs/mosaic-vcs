var crypto = require('crypto');
export default {
    digest : function(data){
        var digest = crypto.createHash('sha1');
        digest.update(data);
        return digest.digest('hex');
    },
    newId : newId
};
let seed = new Date().getTime();
let counter = 0;
function newId(){
    let str = Math.random() + '-' + seed + '-' + new Date().getTime() + '-' + (counter++);
    return sha1(str);
}