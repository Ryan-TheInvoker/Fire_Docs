const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../config/db.js');
const jwt = require('jsonwebtoken');

// secret key for jwt
const secretKey = process.env.JWT_SECRET_KEY || "defaultSecretKey";

const pool = dbConfig

//CRUD OPERATIONS FOR NOTES

// Create a new note
router.post('/', async (req, res) => {

  const { title, content, category_id } = req.body;
  // validate token
  const  token  = req.headers["authorization"]
  let user_id
  try {
      const payload = jwt.verify(token, secretKey)
      user_id = payload.user_id
  } catch(err) {
      res.status(500).json({error: 'Invalid  JWT token'})
      return
  }

  // add to notes table
  const note_query = 'INSERT INTO notes (title, content, category_id, owner_id) VALUES ($1, $2, $3, $4) RETURNING *';
  const note_values = [title, content, category_id, user_id];
  let temp
  try {
    const { rows } = await pool.query(note_query, note_values);
    temp = rows
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
    return
  }

  // add to usernotes table
  const usernote_query = 'INSERT INTO usernotes (user_id, note_id) VALUES ($1, $2)';
  const usernote_values = [user_id, temp[0]["note_id"]];
  try {
    await pool.query(usernote_query, usernote_values);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
    return
      // TODO something needs to be done about this, because if the first database  update works but this one doesnt, we're fucked
  }

  res.status(201).json(temp[0])
});


// retrieve notes that belong to the user belonging to the given categories according the given search and sort instructions
router.get('/get-user-notes/', async(req, res) => {
    try {
        let { search, sort, categories } = req.query
        console.log(search, sort, categories)
        console.log(req.query)
        // validate token
        const  token  = req.headers["authorization"]
        let user_id
        try {
            const payload = jwt.verify(token, secretKey)
            user_id = payload.user_id
        } catch(err) {
            res.status(500).json({error: 'Invalid  JWT token'})
            return
        }

        // check query params
        let search_string = ""
        if (!search || search === "false")
            search = false
        else {
            search_string = search
            search = true
        }
        sort = !(!sort || sort === "false");
        categories = categories.split(",")

        // search
        const { rows } = await pool.query('WITH FilteredNotes AS (\n' +
            '    SELECT n.*\n' +
            '    FROM public.notes n\n' +
            '    JOIN public.usernotes un ON n.note_id = un.note_id\n' +
            '    WHERE un.user_id = $1 \n' +
            '    AND ($2 = FALSE OR n.title ILIKE \'%\' || $3 || \'%\') \n' +
            '    AND n.category_id IN (SELECT category_id FROM public.categories WHERE name = ANY($4))\n' +
            ')\n' +
            '\n' +
            'SELECT *\n' +
            'FROM FilteredNotes\n' +
            'ORDER BY CASE WHEN $5 THEN last_edited END DESC;\n', [user_id, search, search_string, categories, sort])

        res.status(200).json(rows)
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Server error');
    }
})


// Get a list of a user's notes
router.get('/user-notes', async (req, res) => {
    try {
        // validate token
        const  token  = req.headers["authorization"]

        let user_id
        try {
            const payload = jwt.verify(token, secretKey)
            user_id = payload.user_id
        } catch(err) {
            res.status(500).json({error: 'Invalid  JWT token'})
            return
        }
        console.log(user_id)
        const notes = await pool.query('SELECT notes.* FROM notes INNER JOIN usernotes ON notes.note_id = usernotes.note_id WHERE usernotes.user_id = $1', [user_id]);
        //const notes = await pool.query('SELECT * FROM usernotes WHERE user_id = $1', [user_id])
        console.log(notes.rows)
        res.json(notes.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Server error');
    }
});


/*
// List all notes TODO special function do not touch
router.get('/', async (req, res) => {

    try {
        const { rows } = await pool.query('SELECT * FROM notes');
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
 */

//Search for note by title
router.get('/search', async (req, res) => {

    const titleQuery = req.query.title;

    // validate token
    const  token  = req.headers["authorization"]
    let user_id
    try {
        const payload = jwt.verify(token, secretKey)
        user_id = payload.user_id
    } catch(err) {
        res.status(500).json({error: 'Invalid  JWT token'})
        return
    }

    // search for note
    try {
        const { rows } = await pool.query('SELECT notes.* FROM notes JOIN usernotes ON notes.note_id = usernotes.note_id WHERE title ILIKE $1 AND usernotes.user_id = $2', [`%${titleQuery}%`, user_id]);
        if (rows.length === 0) {
            res.status(500).json({error: "no notes found"})
            return
        }
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }

});

// Retrieve a single note by its ID
router.get('/:noteId', async (req, res) => {
    const noteId = req.params.noteId;

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

    // check that the note exists
    let output
    try {
        const { rows } = await pool.query('SELECT * FROM notes WHERE note_id = $1', [noteId]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }
        output = rows[0]
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }

    // check that the user may access that note
    try {
        const { rows } = await pool.query('SELECT * FROM usernotes WHERE note_id = $1 AND user_id = $2', [noteId, user_id])
        if (rows.length === 0) {
            res.status(404).json({ error: 'Unauthorized access' });
            return;
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }

    res.status(200).json(output);
});

// update the title and category of a note

// Update the title and content of a note by its ID
router.put('/:noteId', async (req, res) => {
    const noteId = req.params.noteId;
    const { token, title, content } = req.body;

    // validate token
    let user_id
      try {
          const payload = jwt.verify(token, secretKey)
          user_id = payload.user_id
      } catch(err) {
          res.status(500).json({error: 'Invalid  JWT token'})
          return;
      }

    try {
        // check that the user may access that note
        const { r } = await pool.query('SELECT * FROM usernotes WHERE note_id = $1 AND user_id = $2', [noteId, user_id])
        if (r.length == 0) {
            res.status(404).json({ error: 'Unauthorized access' });
            return;
        }

        // update the note in the database
        const { rowCount } = await pool.query('UPDATE notes SET title = $1, content = $2 WHERE note_id = $3', [title, content, noteId]);
        if (rowCount === 0) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }
        res.status(200).json({ message: 'Note updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// if the user is the owner, delete the note, otherwise just remove the user from the sharing
router.delete("/remove/:noteId", async (req, res) => {
    const noteId = req.params.noteId;

    console.log(1, noteId)

    // validate token
    const  token  = req.headers["authorization"]
    let user_id
    try {
        const payload = jwt.verify(token, secretKey)
        user_id = payload.user_id
    } catch(err) {
        res.status(500).json({error: 'Invalid  JWT token'})
        return
    }

    console.log(2, user_id, token)

    // check if the user is the owner of the note
    let is_owner
    try {
        const { rows } = await pool.query('SELECT owner_id FROM notes WHERE note_id = $1', [noteId])
        if (rows.length === 0) {
            res.status(404).json({error: "No such note"})
            return
        }
        is_owner = rows[0].owner_id === user_id;
        console.log(rows, user_id)
    } catch {
        res.status(500).json("Server error")
        return
    }

    console.log(3, is_owner)

    if (is_owner) {
        // remove note from usernotes table
        try {
            await pool.query('DELETE FROM usernotes WHERE note_id = $1', [noteId])
        } catch {
            res.status(500).json("Server error")
            return
        }
        // remove note from notes table
        try {
            await pool.query('DELETE FROM notes WHERE note_id = $1', [noteId])
        } catch {
            res.status(500).json("Server error")
            return
        }
    } else {
        // check if the user has access to the note
        try {
            const {rows} = await pool.query('SELECT * FROM usernotes WHERE note_id = $1 AND user_id = $2', [noteId, user_id])
            if (rows.length === 0) {
                res.status(400).json("Unauthorized access")
                return
            }
        } catch {
            res.status(500).json("Server error")
            return
        }
        // remove user_id-note_id pair from usernotes table
        try {
            await pool.query('DELETE FROM usernotes WHERE note_id = $1 AND user_id = $2', [noteId, user_id])
        } catch {
            res.status(500).json("Server error")
            return
        }
    }

    // TODO also check if category must be cleared

    res.status(200).json("Note removed")

})


// Remove a note by its ID
router.delete('/:noteId', async (req, res) => {
    const noteId = req.params.noteId;

    // validate token
    const  token  = req.headers["authorization"]
    let user_id
    try {
        const payload = jwt.verify(token, secretKey)
        user_id = payload.user_id
    } catch(err) {
        res.status(500).json({error: 'Invalid  JWT token'})
        return
    }

    try {
        // check that the user is the owner
        const { rows } = await pool.query('SELECT * FROM notes WHERE note_id = $1 AND user_id = $2', [noteId, user_id])
        if (rows.length === 0) {
            res.status(404).json({ error: 'Unauthorized access' });
            return;
        }

        // delete the note
        const { rowCount } = await pool.query('DELETE FROM notes WHERE note_id = $1', [noteId]);
        if (rowCount === 0) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }
        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Share a note with a user: basically adds an entry into the usernotes table which links the users to notes
router.post('/share/:note_id', async (req, res) => {
    // validate token
    const  token  = req.headers["authorization"]

    const { email } = req.body

    let user_id
    try {
        const payload = jwt.verify(token, secretKey)
        user_id = payload.user_id
    } catch(err) {
        res.status(500).json({error: 'Invalid  JWT token'})
        return
    }

    try {

        const { note_id } = req.params;

        // check that the user has access
        const { rows } = await pool.query('SELECT * FROM usernotes WHERE note_id = $1 AND user_id = $2', [note_id, user_id])

        if (rows.length === 0) {
            res.status(404).json({ error: 'Unauthorized access' });
            return;
        }

        // get the share user ID
        let share_user
        try {
            const {rows} = await pool.query('SELECT user_id FROM users WHERE email = $1', [email])
            share_user = rows[0].user_id
            if (rows.length === 0) {
                res.status(400).json("No user with such email")
                return
            }
        } catch(err) {
            res.status(400).json("No user with such email")
            return
        }

        await pool.query('INSERT INTO usernotes (user_id, note_id) VALUES ($1, $2)', [share_user, note_id]);

        res.status(200).json({ message: 'Note shared successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Already shared with user');
    }
});

// Get user_ids for users sharing a particular  TODO speciaal function, do not touch
router.get('/shared-users/:note_id', async (req, res) => {
    try {
        const { note_id } = req.params;
        const users = await pool.query('SELECT user_id FROM usernotes WHERE note_id = $1', [note_id]);
        res.json(users.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json('Server error');
    }
});

// Get notes sorted by time last edited (most recent first)
router.get('/sorted', async (req, res) => {
    "SELECT notes.* FROM notes JOIN usernotes ON notes.note_id = usernotes.note_id WHERE title ILIKE $1 AND usernotes.user_id = $2"
    // validate token
    const  token  = req.headers["authorization"]
    let user_id
    try {
        const payload = jwt.verify(token, secretKey)
        user_id = payload.user_id
    } catch(err) {
        res.status(500).json({error: 'Invalid  JWT token'})
        return
    }

    // get the sorted notes
    try {
      // if this works I'll eat my flip flops
      const { rows } = await pool.query('SELECT notes.* FROM notes JOIN usernotes ON notes.note_id = usernotes.note_id WHERE usernotes.user_id = $1 ORDER BY last_edited DESC', [user_id]);
      res.status(200).json(rows);
  } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Filter list of notes by category name
router.get('/category/:categoryName', async (req, res) => {
  const categoryName = req.params.categoryName;

    // validate token
    const  token  = req.headers["authorization"]
    let user_id
    try {
        const payload = jwt.verify(token, secretKey)
        user_id = payload.user_id
    } catch(err) {
        res.status(500).json({error: 'Invalid  JWT token'})
        return
    }

  try {
      const { rows: category } = await pool.query('SELECT * FROM categories WHERE name = $1', [categoryName]);
      if (!category[0]) {
          return res.status(404).json({ error: 'Category not found' });
      }

      const categoryId = category[0].category_id;
      // if this works I'll shove a cactus up my ass
      const { rows: notes } = await pool.query('SELECT notes.* FROM notes JOIN usernotes ON notes.note_id = usernotes.noteid WHERE category_id  = $1 AND usernotes.user_id = $2', [categoryId, user_id]);
      
      res.status(200).json(notes);
  } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
