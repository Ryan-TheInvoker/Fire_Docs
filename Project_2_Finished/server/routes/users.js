const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require("multer");
const fs = require('fs');

const dir = './uploads';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// secret key for jwt
const secretKey = process.env.JWT_SECRET_KEY || "defaultSecretKey";

const path = require("path");

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


// Register a new user
//Uniqueness of username and email address is enforced in the database
router.post('/register', upload.single('avatar'), async (req, res) => {



    const avatar = req.file; // This will contain your avatar data

    const { username, email, password, avatar_url } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const savedAvatarUrl = avatar ? 'uploads/' + avatar.filename : avatar_url || null;

    const query = 'INSERT INTO users (username, email, password, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [username, email, hashedPassword, savedAvatarUrl]; //avatar_url is optional field

    try {
        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === '23505') { // This is the code for a unique constraint violation in PostgreSQL
            if (err.detail.includes('username')) {
                res.status(400).json({ error: 'Username already taken' });
            } else if (err.detail.includes('email')) {
                res.status(400).json({ error: 'Email already registered' });
            } else {
                res.status(400).json({ error: 'Duplicate field value' });
            }
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
})

// Update user avatar
router.post('/update-avatar', upload.single('avatar'), async (req, res) => {
    // This will contain the new avatar data
    const newAvatar = req.file;

    // validate token
    const  token  = req.headers["authorization"]
    let user_id
    try {
        const payload = jwt.verify(token, secretKey)
        user_id = payload.user_id
    } catch(err) {
        res.status(500).json({error: 'Invalid  JWT token'})
        return;
    }

    if (!newAvatar || !user_id) {
        return res.status(400).json({ error: 'Invalid request, avatar or user ID missing' });
    }

    // Prepare the new avatar URL
    const newAvatarUrl = 'uploads/' + newAvatar.filename;

    // SQL query to update the avatar_url in the users table
    const query = 'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING *';
    const values = [newAvatarUrl, user_id];

    try {
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Login user
router.post('/login', async (req, res) => {
  const { email, password, remember } = req.body;
  try {
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = rows[0];

      if (!user || !await bcrypt.compare(password, user.password)) {
          return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT for the user
      let token
      if (remember) {
          token = jwt.sign({"user_id": user.user_id}, secretKey);
      } else {
          token = jwt.sign({"user_id": user.user_id}, secretKey, {expiresIn: '1h'});
      }

      res.status(200).json({ token });
  } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

/*
// Get user profile
router.get('/profile', async (req, res) => {
  // Assuming the user's ID is stored in the JWT and attached to the req object by a previous middleware
  const userId = req.userId;
  try {
      const { rows } = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
      res.status(200).json(rows[0]);
  } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
 */

/*
// Update user profile
// TODO 1. jwt 2. update the profile of the user_id in the jwt token payload, there must be no userId in req
router.put('/profile', async (req, res) => {
  const userId = req.userId;
  const { username, email } = req.body;
  
  try {
      const { rowCount } = await pool.query('UPDATE users SET username = $1, email = $2 WHERE user_id = $3', [username, email, userId]);
      if (rowCount === 0) {
          return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json({ message: 'Profile updated successfully' });
  } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
 */


// Update the profile of the user with the jwt token
router.put('/update-profile', async (req, res) => {
    try {
        // validate token
        const  token  = req.headers["authorization"]
        let user_id
        try {
            const payload = jwt.verify(token, secretKey)
            user_id = payload.user_id
        } catch(err) {
            console.log(err)
            res.status(500).json({error: 'Invalid  JWT token'})
            return;
        }

        const { username, email, password } = req.body;

        if (!username || !email) {
            res.status(400).json({error: "Invalid username/email"})
            return
        }

        // check that the username doesn't already exist
        try {
            const {rows} = await pool.query('SELECT user_id from users WHERE username = $1', [username])
            if (rows.length !== 0 && rows[0].user_id !== user_id) {
                res.status(400).json({error: "username already in use"})
            }
        } catch(err) {
            res.status(500).json({error: 'Server Error'})
            return;
        }

        // check that the email doesn't already exist
        try {
            const {rows} = await pool.query('SELECT user_id from users WHERE email = $1', [email])
            if (rows.length !== 0 && rows[0].user_id !== user_id) {
                res.status(400).json({error: "email already in use"})
            }
        } catch(err) {
            res.status(500).json({error: 'Server Error'})
            return;
        }

        if (password) {
            console.log("HERE IS THE NEW PASSWORD", password)
            const hashedPassword = await bcrypt.hash(password, 10);
            // update all
            await pool.query('UPDATE users SET username = $1, email = $2, password = $3 WHERE user_id = $4', [username, email, hashedPassword, user_id])
        } else {
            // update all excluding password
            await pool.query('UPDATE users SET username = $1, email = $2 WHERE user_id = $3', [username, email, user_id])
        }
        res.status(200).json("Update successful")
    } catch(err) {
        res.status(500).json("Sever error")
    }

})


// Delete user account and all associated notes
router.delete('/delete-profile', async (req, res) => {
    try {
        console.log("I long for the sweet release that death will bring")
        // validate token
        const  token  = req.headers["authorization"]
        let user_id
        try {
            const payload = jwt.verify(token, secretKey)
            user_id = payload.user_id
        } catch(err) {
            console.log(err)
            res.status(500).json({error: 'Invalid  JWT token'})
            return;
        }

        // delete usernotes entries for all owned notes
        try {
            // first get all the notes the user owns
            const {rows} = await pool.query('SELECT note_id from notes WHERE owner_id = $1', [user_id])
            // then delete everything from the usernotes table
            for (let i = 0; i < rows.length; i++) {
                await pool.query('DELETE FROM usernotes WHERE note_id = $1', [rows[i].note_id])
            }
        } catch {
            res.status(500).json({error: 'Server Issue'})
            return;
        }

        // delete all owned notes
        try {
            await pool.query('DELETE FROM notes WHERE owner_id = $1', [user_id])
        } catch {
            res.status(500).json({error: 'Server Issue'})
            return;
        }

        // delete user
        await pool.query('DELETE FROM users WHERE user_id = $1', [user_id])

        res.json({ message: 'User account and associated notes deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Server error');
    }
});


/*
// List all users
router.get('/', async (req, res) => {
    try {
        const users = await pool.query('SELECT * FROM users');
        res.json(users.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Server error');
    }
});
 */


/*
// Get a list of a user's notes
// TODO 1. jwt 2. the lists must come from the user_id in the jwt
router.get('/shared-notes', async (req, res) => {
    try {
        const token  = req.headers["authorization"];

        // TODO, verification
        const payload = jwt.verify(token, secretKey)
        const user_id = payload.user_id

        const notes = await pool.query('SELECT notes.* FROM notes INNER JOIN usernotes ON notes.note_id = usernotes.note_id WHERE usernotes.user_id = $1', [user_id]);
        res.json(notes.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Server error');
    }
});
 */

// get a user's username given their ID
// TODO maybe some sort of JWT verification - maybe if the auth user shares docs with the given user, there's a lot to be done here
router.get('/get-user-info/:user_id', async (req, res) => {
    try {
        const {user_id} = req.params
        const { rows } = await pool.query('SELECT username, email FROM users WHERE user_id = $1', [user_id])
        res.status(200).json(rows[0])
    } catch {
        res.status(500).json("Sever error")
    }
})

// get a user's info from his jwt token
router.get('/get-my-info', async (req, res) => {
    try {
        // validate token
        const  token  = req.headers["authorization"]
        let user_id
        try {
            const payload = jwt.verify(token, secretKey)
            user_id = payload.user_id
        } catch(err) {
            console.log(err)
            res.status(500).json({error: 'Invalid  JWT token'})
            return;
        }

        const { rows } = await pool.query('SELECT username, email FROM users WHERE user_id = $1', [user_id])
        res.status(200).json(rows[0])
    } catch {
        res.status(500).json("Sever error")
    }
})



// Get avatar
router.get('/get-avatar', async (req, res) => {
    // validate token
    const  token  = req.headers["authorization"]
    let user_id
    try {
        const payload = jwt.verify(token, secretKey)
        user_id = payload.user_id
    } catch(err) {
        res.status(500).json({error: 'Invalid  JWT token'})
        return;
    }

    // Fetch avatar_url using userId from the database
    const query = 'SELECT avatar_url FROM users WHERE user_id = $1';
    const values = [user_id];

    try {

        const { rows } = await pool.query(query, values);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const avatarUrl = rows[0].avatar_url;
        if (avatarUrl === null) {
            return res.status(404).json({ error: 'Avatar not found' });
        }
        // Construct the full path of the file
        const filePath = path.join(__dirname, '..', avatarUrl);
        // Check if file exists
        fs.exists(filePath, function(exists) {
            if (exists) {
                // Set the content type based on the file extension
                res.setHeader('Content-Type', 'image/png'); // Change this based on your file types

                // Read and send the file
                fs.createReadStream(filePath).pipe(res);
            } else {
                res.status(404).json({ error: 'Avatar not found' });
            }
        });

    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;
