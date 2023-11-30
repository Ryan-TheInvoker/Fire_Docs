const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');

// secret key for jwt
const secretKey = process.env.JWT_SECRET_KEY || "ihatemyself";

// Import database configuration
const client = require('./config/db.js')
client.connect()

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

/*
async function runQuery() {
  try {
    const result = await client.query('SELECT * from notes');
    console.log(result.rows);
  } catch (err) {
    console.error("Error running query", err);
  }
}

runQuery();
*/


// websocket
const wss = new WebSocket.Server({ port: 8081 });
const noteClients = new Map();

wss.on('connection', (ws) => {
  console.log("SOMEONE CONNECTED")
  let authenticated = false;
  let note_id;

  ws.on('message', async (message) => {
    if (!authenticated) {
        console.log("SOMEONE IS TRYING TO AUTHENTICATE")
      // User just connected, authenticate and send the doc
      try {

        const data = JSON.parse(message);


        // validate token
        const token = data.token;
        let user_id
        try {
          const payload = jwt.verify(token, secretKey)
          user_id = payload.user_id
        } catch(err) {
          //res.status(500).json({error: 'Invalid  JWT token'})
          // TODO tell them bad jwt
          console.log(err)
          ws.close()
          return
        }

        // check that the note exists and that the user has access to the note
        note_id = data.note_id;
        try {
          const {rows} = await client.query('SELECT * FROM usernotes WHERE user_id = $1 AND note_id = $2', [user_id, note_id])
          if (rows.length === 0) {
            // TODO tell them that there is no note they can access with that id
            ws.close()
            return
          }
        } catch(err) {
          ws.close()
          return
        }



        const noteExists = true


        // update local map
        if (noteExists) {
          authenticated = true;
          if (!noteClients.has(note_id)) {
            noteClients.set(note_id, []);
          }
          noteClients.get(note_id).push([ws, user_id]);
        } else {
          ws.close();
        }

        // send the note to the user TODO lots of work to be done here
        const noteQuery = 'SELECT content FROM notes WHERE note_id = $1'
        const  content  = await client.query(noteQuery, [note_id])



        const shared_users = noteClients.get(note_id).map(a => a[1])
        if (noteClients.has(note_id)) {
          noteClients.get(note_id).forEach((c) => {
            if (/*client !== ws && */c[0].readyState === WebSocket.OPEN) {
              const payload = {
                content: content.rows[0]["content"],
                user_ids: shared_users
              };
              // Convert this object to a JSON string
              const payloadString = JSON.stringify(payload);
              // Create a buffer from the JSON string
              const buffer = Buffer.from(payloadString);
              // Send the buffer to the client
              c[0].send(buffer);
            }
          });
        }




        //const buffer = Buffer.from(content.rows[0]["content"]);

        //ws.send(buffer);


      } catch (err) {
            console.log(err)
        ws.close();
      }
      console.log("SOMEONE JUST AUTHENTICATED")
    } else {
        console.log("SOMEONE JUST SENT AN UPDATE")
      // User just sent an update
      const data = JSON.parse(message);
      note_id = data.note_id;

      // Handle note modifications
      // Update the database and broadcast to all clients
      // You may use something like:
      // const result = await updateNoteInDatabase(note_id, message); // Implement this function to update database

      // update in the database TODO LOTS OF WORK TO BE DONE HERE
      const updateQuery = 'UPDATE notes SET content = $1, last_edited = CURRENT_TIMESTAMP WHERE note_id = $2'
      const { cheese } = await client.query(updateQuery, [data.content, note_id])

      // Broadcast to all other clients connected to this note_id
      const shared_users = noteClients.get(note_id).map(a => a[1])
      if (noteClients.has(note_id)) {
        noteClients.get(note_id).forEach((c) => {
          console.log(c[1])
          if (/*client !== ws && */c[0].readyState === WebSocket.OPEN) {
            const payload = {
              content: data.content,
              user_ids: shared_users
            };
            // Convert this object to a JSON string
            const payloadString = JSON.stringify(payload);
            // Create a buffer from the JSON string
            const buffer = Buffer.from(payloadString);
            // Send the buffer to the client
            c[0].send(buffer);
          }
        });
      }
    }
  });

  ws.on('close', async () => {
      try {
        // Remove this client from the list of clients connected to this note_id
        if (noteClients.has(note_id)) {
          // Filter out the specific client (ws object)
          const clients = noteClients.get(note_id).filter((client) => client[0] !== ws);
          // Update the map accordingly
          if (clients.length > 0) {
            noteClients.set(note_id, clients);
          } else {
            noteClients.delete(note_id);
          }
        }

        const noteQuery = 'SELECT content FROM notes WHERE note_id = $1'
        const content = await client.query(noteQuery, [note_id])

        const shared_users = noteClients.get(note_id).map(a => a[1])
        if (noteClients.has(note_id)) {
          noteClients.get(note_id).forEach((c) => {
            if (/*client !== ws && */c[0].readyState === WebSocket.OPEN) {
              const payload = {
                content: content.rows[0]["content"],
                user_ids: shared_users
              };
              // Convert this object to a JSON string
              const payloadString = JSON.stringify(payload);
              // Create a buffer from the JSON string
              const buffer = Buffer.from(payloadString);
              // Send the buffer to the client
              c[0].send(buffer);
            }
          });
        }

      } catch {}
  });

});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

