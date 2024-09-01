const yargs = require("yargs");
const { insertOnUpdate } = require('../../../postgres-query-builder');
const { error, success } = require('../../src/lib/log/logger');
const {
    hashPassword
  } = require('../../src/lib/util/passwordHelper');
const { pool } = require('../../src/lib/postgres/connection');

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
function isValidPassword(password) {
return password.length >= 8;
}

const { argv } = yargs.
    option('name', {
        alias: 'n',
        description: 'Admin user full name',
        demandOption: true,
        type: 'string',
        validate: (name) => {
            if(name.length === 0) {
                throw new Error('Full name is required');
            }
            return true;
        }
    })
    .option('email', {
        alias: 'e',
        description: 'Admin user email',
        demandOption: true,
        type: 'string',
        validate: (email) => {
            if(!isValidEmail(email)) {
                throw new Error('Invalid email');
            }
            return true;
        }
    })
    .option('password', {
        alias: 'p',
        description: 'Admin user password',
        demandOption: true,
        type: 'string',
    })
    .check((argv) => {
        if(!isValidPassword(argv.password)) {
            throw new Error('Password must be at least 8 characters long');
        }
        return true;
    })
    .help();

async function createAdminUser(){
    const {name: full_name, email, password} = argv
    try {
        await insertOnUpdate('admin_user', ['email'])
            .given({
                full_name,
                email,
                password: hashPassword(password)
            })
            .execute(pool)
        success('Admin user created successfully')
        process.exit(0);
    } catch (e) {
        error(e);
        process.exit(0);
    }
}

createAdminUser();