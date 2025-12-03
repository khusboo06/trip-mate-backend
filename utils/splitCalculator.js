function equalSplit(total, count){
const per = Math.round((total / count) * 100) / 100;
return new Array(count).fill(per);
}
module.exports = { equalSplit };