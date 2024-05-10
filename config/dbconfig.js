require("dotenv").config({
  path:'../.env'
});
const Pool = require("pg-pool");
const pg = require("pg");
const { Client } = require("pg");
// DBUSER ="postgres",
// host="localhost",
// database= "user_management",
// password= "sahil2210#",
// port= 8080,

const pool = new Pool({
  user: process.env.DBUSER,
  host: process.env.DBHOST,
  database: process.env.DBNAME,
  password: process.env.DBPASSWORD,
  port: process.env.DBPORT,
  max: 15,
});

module.exports = {
  pool,
};
