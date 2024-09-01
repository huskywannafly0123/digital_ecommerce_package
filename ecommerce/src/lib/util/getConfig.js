const config = require('config')

function getConfig(path, defaultValue){
    return path.has(path) ? config.get(path) : defaultValue
}

module.exports = exports = {}
exports.getConfig = getConfig