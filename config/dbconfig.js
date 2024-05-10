require("dotenv").config();
const Pool = require("pg-pool");
const pg = require("pg");
const { Client } = require("pg");
// DBUSER ="postgres",
// host="localhost",
// database= "user_management",
// password= "sahil2210#",
// port= 8080,

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "user_management",
  password: "sahil2210#",
  port: 5432,
  max: 15,
});

module.exports = {
  pool,
};
