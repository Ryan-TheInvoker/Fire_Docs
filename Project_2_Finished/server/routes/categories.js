const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dbConfig = require('../config/db.js');
const jwt = require('jsonwebtoken');

// secret key for jwt
const secretKey = process.env.JWT_SECRET_KEY || "defaultSecretKey";

const pool = dbConfig

//CRUD OPERATIONS

// Create a new category
router.post('/', async (req, res) => {
  const { name } = req.body;


  // verify jwt token
  const token = req.headers["authorization"]
  try {
      jwt.verify(token, secretKey)
  } catch(err) {
      res.status(500).json({error: 'Invalid  JWT token'})
      return
  }

  // check if category already exists
  try {
      const { rows } = await pool.query('SELECT * FROM categories WHERE name = $1', [name])
      if (rows.length !== 0) {
          console.log(rows)
          res.status(409).json({error: 'category name already exists', category_id: rows[0]["category_id"]})
          return
      }
  } catch (err) {
      res.status(500).json({error: 'Internal Server Error'})
      return
  }


  // insert category
  const query = 'INSERT INTO categories (name) VALUES ($1) RETURNING *';
  const values = [name];
  try {
      const { rows } = await pool.query(query, values);
      res.status(201).json(rows[0]);
  } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// get all the categories of notes that a user has access to
router.get('/', async(req, res) => {

    // verify jwt token
    const token = req.headers["authorization"]
    let user_id
    try {
        const payload = jwt.verify(token, secretKey)
        user_id = payload.user_id
    } catch(err) {
        res.status(500).json({error: 'Invalid  JWT token'})
        return
    }

    // get all categories
    try {
        const {rows} = await pool.query('SELECT DISTINCT c.name, c.category_id\n' +
            'FROM public.categories c\n' +
            'JOIN public.notes n ON c.category_id = n.category_id\n' +
            'JOIN public.usernotes un ON n.note_id = un.note_id\n' +
            'WHERE un.user_id = $1', [user_id])
        console.log(rows)
        res.status(200).json(rows)
    } catch(err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }

});

/*
// List all categories TODO this is a special function, do not touch, I'll figure out what to do with this later
router.get('/', async (req, res) => {
  try {
      const { rows } = await pool.query('SELECT * FROM categories');
      res.status(200).json(rows);
  } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
 */

/*
// Retrieve a single category by its ID TODO special function, do not touch
router.get('/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;
  
  try {
      const { rows } = await pool.query('SELECT * FROM categories WHERE category_id = $1', [categoryId]);
      if (rows.length === 0) {
          res.status(404).json({ error: 'Category not found' });
          return;
      }
      res.status(200).json(rows[0]);
  } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
*/

/*
// Update the name of a category by its ID TODO special function, do not touch
router.put('/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;
  const { name } = req.body;
  
  try {
      const { rowCount } = await pool.query('UPDATE categories SET name = $1 WHERE category_id = $2', [name, categoryId]);
      if (rowCount === 0) {
          res.status(404).json({ error: 'Category not found' });
          return;
      }
      res.status(200).json({ message: 'Category updated successfully' });
  } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
 */

/*
// Remove a category by its ID TODO special function do not touch
router.delete('/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;
  
  try {
      const { rowCount } = await pool.query('DELETE FROM categories WHERE category_id = $1', [categoryId]);
      if (rowCount === 0) {
          res.status(404).json({ error: 'Category not found' });
          return;
      }
      res.status(200).json({ message: 'Category deleted successfully' });
  } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
 */

module.exports = router;
