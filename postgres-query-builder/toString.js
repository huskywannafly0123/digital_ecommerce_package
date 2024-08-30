module.exports = exports = {}
exports.toString = function toString(value){
    if(Array.isArray(value) || (typeof value === 'object' && value !== null)){
        return JSON.stringify(value)
    } else {
        return value
    }
}