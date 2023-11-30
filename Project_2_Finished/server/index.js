//MAIN ENTRY POINT
//In summary, index.js sets up and starts an Express web server, configures various middleware,
//sets up a database connection, and defines routes for handling incoming requests.


//TODO: what is server url?


const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

// Import database configuration
const dbConfig = require('./config/db.js');

//fetching the DB info from the db.js file in the config folder.
const pool = require('./config/db.js');


// Initialize Express app
const app = express();

// Setup middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes 
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const noteRoutes = require('./routes/notes');

//Using  routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notes', noteRoutes);

//Web socket?

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
