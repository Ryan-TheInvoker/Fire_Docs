const db = require('./db');

db.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error querying the database', err.stack);
  } else {
    console.log('Database connected!', res.rows[0]);
  }
  db.end();  // close the database connection
});
