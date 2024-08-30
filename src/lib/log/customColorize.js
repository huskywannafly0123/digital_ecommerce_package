const { format } = require('winston')
const { LEVEL } = require('triple-beam')

const { colorize } = format;
class CustomColorize extends colorize.Colorizer {
    constructor(opts = {}){
        super(opts);
    }

    transform(info, opts) {
        super.transform(info, opts);
        if(info.stack){
            info.stack = this.colorize(info[LEVEL], info.level, info.stack);
        }
        return info;
    }
}

module.exports = (opts) => CustomColorize(opts);