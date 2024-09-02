const fs = require('fs');
const csv = require('csv-parser');

async function readCsvFile(filePath){
    return new Promise((resolve, reject) => {
        const results = {}
        fs.createReadStream(filePath)
            .pipe(csv({ headers: false }))
            .on('data', (data) => {
                if(!data[0].startsWith('#')){
                    results[data[0]] = data[1];
                }
            })
            .on('end', () => {
                resolve(results)
            })
            .on('error', (error) => {
                reject(error)
            })
    })
}

module.exports.readCsvFile = readCsvFile;
