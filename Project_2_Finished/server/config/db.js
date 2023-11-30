//this connects our database to the node.js server

//import the pool object from pg lib. Allows us to manage connections to postgres DB
const { Client } = require('pg');

//module which loads stuff from .env file
const dotenv = require('dotenv');

//read stuff from .env file into process.env; makes it accessible throughout application
dotenv.config();


//Here, we create a new instance of the Pool object and configure it using environment variables from process.env
const connectionString = process.env.DATABASE_URL;

const temp = "postgresql://postgres:Mantastyle1@db:5432/mydatabase"

const db = new Client({
  connectionString: temp,
});


//exports the pool object which makes it available to other files
module.exports = db;
