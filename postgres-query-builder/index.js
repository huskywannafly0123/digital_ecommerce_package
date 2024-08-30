const { toString } = require('./toString')
class Query {
    constructor() {
        this._binding = []
    }

    async execute(connection, releaseConnection = true){
        let sql = await this.sql(connection)
        let binding = []
        let id = 0
        for(let key in this._binding){
            id += 1
            if(this._binding.hasOwnProperty(key)){
                sql = sql.replace(`:${key}`,`$${id}`)
                binding.push(this._binding[key])
            }
        }
        let { rows } = await connection.query({
            text: sql,
            values: binding
        })
        if(releaseConnection){
            release(connection)
        }
        return rows
    }
}

class InsertOnUpdateQuery extends Query {
    constructor(table, conflictColumns) {
        super()
        this._table = table
        this._data = []
        this._conflictColumns = conflictColumns
    }

    given(data) {
        if(typeof data !== 'object' || data === null){
            throw new Error('Data must be an object and not null');
        }
        let copy = {}
        Object.keys(data).forEach((key) => {
            copy[key] = toString(data[key])
        })
        this._data = copy
        return this
    }

    prime(field, value){
        this._data[field] = toString(value)
        return this
    }

    async sql(connection){
        if(!this._table){
            throw Error('You need to call specific method first');
        }

        if(Object.keys(this._data).length === 0){
            throw Error('You need provide data first');
        }

        let rows = await connection.query({
            text: `SELECT 
            table_name, 
            column_name, 
            data_type, 
            is_nullable, 
            column_default, 
            is_identity, 
            identity_generation 
          FROM information_schema.columns 
          WHERE table_name = $1`,
          values: [this._table]
        })

        let fs = [],
        vs = [],
        us = [],
        usp = [];
        rows.forEach((field) => {
        if (['BY DEFAULT', 'ALWAYS'].includes(field['identity_generation'])) {
            return;
        }
        if (this._data[field['column_name']] === undefined) {
            return;
        }
        let key = uniqid();
        let ukey = uniqid();
        fs.push(`"${field['column_name']}"`);
        vs.push(`:${key}`);
        us.push(`"${field['column_name']}" = :${ukey}`);
        usp[ukey] = this._data[field['column_name']];
        this._binding[key] = this._data[field['column_name']];
        });

        this._binding = { ...this._binding, ...usp };

        let sql = [
            'INSERT INTO',
            `${this._table}`,
            '(',
            fs.join(', '),
            ')',
            'VALUES',
            '(',
            vs.join(', '),
            ')',
            `ON CONFLICT (${this._conflictColumns.join(", ")}) DO UPDATE SET`,
            us.join(', '),
            'RETURNING *'
        ]
            .filter((e) => e !== '')
            .join(' ')
        return sql
    }

    async execute(connection, releaseConnection){
        const rows = await super.execute(connection, releaseConnection)
        const insertedRow = rows[0]
        if(this._primaryColumn){
            insertedRow['insertId'] = insertedRow[this._primaryColumn]
        }
        return insertedRow
    }
}

function release(connection) {
    if(connection.INTRANSACTION === true){
        return
    }
    if(connection.constructor.name === 'BoundPool'){
        return
    }
    connection.release()
}