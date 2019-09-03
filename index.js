const mysql = require('mysql');
const fs = require('fs');
const { exec } = require('child_process');

// Where would the file be located?
const dumpFile = 'dump.sql';



async function main() {
    try {
        const config = JSON.parse(fs.readFileSync('./config/conf.json'));
        //console.log(config);
        const connFrom = mysql.createConnection({
            host: config.mysqlFrom.host,
            user: config.mysqlFrom.user,
            password: config.mysqlFrom.password,
            database: config.mysqlFrom.database
        });

        // Database connection settings.
        let exportFrom = {
            host: config.mysqlFrom.host,
            user: config.mysqlFrom.user,
            password: config.mysqlFrom.password,
            database: config.mysqlFrom.database,
            table: config.mysqlFromTableName
        }
        let importTo = {
            host: config.mysqlTo.host,
            user: config.mysqlTo.user,
            password: config.mysqlTo.password,
            database: config.mysqlTo.database
        }

        console.log(`Starting exporting data from the ${exportFrom.database} database`);

        // Execute a MySQL Dump and redirect the output to the file in dumpFile variable.
        exec(`mysqldump -u${exportFrom.user} -p${exportFrom.password} -h${exportFrom.host} ${exportFrom.database} ${exportFrom.table} > ${dumpFile}`, (err, stdout, stderr) => {
            if (err) { console.error(`exec error: ${err}`); return; }

            console.log(`Now, importing data to the ${importTo.database} database`);

            // Import the database.
            exec(`mysql -u${importTo.user} -p${importTo.password} -h${importTo.host} ${importTo.database} < ${dumpFile}`, (err, stdout, stderr) => {
                if (err) { console.error(`exec error: ${err}`); return; }

                console.log(`The import has finished.`);

                console.log(`Deleting table ${exportFrom.table} from ${exportFrom.database}`);

                connFrom.connect((err) => {
                    if (err) console.log("Error Connecting to export from database");
                    else {
                        console.log("Connection Successfull to export from databse");
                        let sql = `DROP TABLE IF EXISTS ${exportFrom.table}`;
                        connFrom.query(sql, function (err, result) {
                            if (err) console.log("Error deleting table from export: ", err.toString());
                            console.log(`${exportFrom.table} Table deleted`);

                            console.log("Starting dump.sql deletion.");
                            fs.unlinkSync(__dirname + "/" +dumpFile);
                            console.log("Dump file deleted");
                            connFrom.end();
                        });
                        
                    }
                });

            });

        });




    }
    catch (ex) {
        console.log(ex.toString());
    }
}

// calling main : Start of program
main()