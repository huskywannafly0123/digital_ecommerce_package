function getEnv(name, defaultValue = undefined) {
    const value = process.env[name];
    return value === undefined ? defaultValue : value;
}
module.exports.getEnv = getEnv;