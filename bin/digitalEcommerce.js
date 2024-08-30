const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const { argv } = yargs(hideBin(process.argv));
const command = argv._[0];

try {
    if(command === 'user:create') {
        require('./user/create');
    } else {
        throw new Error('Invalid command');
    }
} catch (e) {
    const { error } = require('../src/lib/log/logger')
    error(e)
}
const { error } = require('../src/lib/log/logger')
process.on('uncaughtException', (exception) => {
    error(exception);
});
process.on('unhandledRejection', (reason, promise) => {
    error(`Unhandled Rejection: ${reason} at: ${promise} `);
});