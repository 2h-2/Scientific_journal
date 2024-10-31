const mysql = require("mysql");
const connection = mysql.createConnection({
    host     : process.env.HOSTNAME,
    user     : process.env.USER_DB,
    password : '',
    database : process.env.DATABASE_URL,
    port: 3306
});

connection.connect((err) => {
    if (err) {
    console.error('connection err' + err.stack);
    return;
    }

    console.log("connection succeeded");
});

module.exports = connection;

