const mysql = require('mysql2');

let connection = mysql.createConnection({
   host:process.env.DB_HOST,
   user:process.env.DB_USER,
   password:process.env.DB_PASSWORD,
   database:process.env.DB_NAME,
   charset: 'utf8mb4',
});



const mySqlQury =(qry)=>{
    return new Promise((resolve, reject)=>{
        connection.query(qry, (err, row)=>{
            if (err) return reject(err);
            resolve(row)
        })
    }) 
}

module.exports = {connection, mySqlQury}