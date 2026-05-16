

const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const { body, validationResult } = require('express-validator');


const { getPool, sql } = require('../config/database');


const { redirectIfLoggedIn } = require('../middleware/auth');





router.get('/register', redirectIfLoggedIn, (req, res) => {
  
  res.sendFile('register.html', { root: './public' });
});


router.post('/register', redirectIfLoggedIn, [

  

  body('username')
    .trim()                        // remove surrounding whitespace
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3–50 characters')
    // Alphanumeric + underscore only → prevents many injection attempts
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username may only contain letters, numbers, and underscores'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(), // lowercase, remove dots in Gmail addresses, etc.

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')

], async (req, res) => {

  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  
  const { username, email, password } = req.body;

  try {
    const pool = getPool();

    
    const existing = await pool.request()
      .input('username', sql.NVarChar(50),  username) // bind :username param
      .input('email',    sql.NVarChar(100), email)    // bind :email param
      .query(`
        SELECT id FROM users
        WHERE username = @username OR email = @email
      `);

    if (existing.recordset.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or email already in use' });
    }

    
    const hashedPassword = await bcrypt.hash(password, 12);

   
    await pool.request()
      .input('username', sql.NVarChar(50),  username)
      .input('email',    sql.NVarChar(100), email)
      .input('password', sql.NVarChar(255), hashedPassword)
      .query(`
        INSERT INTO users (username, email, password)
        VALUES (@username, @email, @password)
      `);

    
    res.json({ success: true, message: 'Account created! Please log in.' });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});





router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.sendFile('login.html', { root: './public' });
});


router.post('/login', redirectIfLoggedIn, [

  body('identifier')   // 'identifier' accepts either a username or email
    .trim()
    .notEmpty().withMessage('Username or email is required'),

  body('password')
    .notEmpty().withMessage('Password is required')

], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { identifier, password } = req.body;

  try {
    const pool = getPool();

    // Look up the user by username OR email (parameterised – safe from SQL injection)
    const result = await pool.request()
      .input('identifier', sql.NVarChar(100), identifier)
      .query(`
        SELECT id, username, password
        FROM users
        WHERE username = @identifier OR email = @identifier
      `);

    
    const user = result.recordset[0];
    const dummyHash = '$2a$12$invalidhashtopreventtimingattacks000000000000000000000'; // ignored
    const passwordMatch = await bcrypt.compare(password, user ? user.password : dummyHash);

    if (!user || !passwordMatch) {
      // Deliberately vague error: don't reveal whether the username or password was wrong
      return res.status(401).json({ success: false, message: 'Invalid username/email or password' });
    }

    
    req.session.userId   = user.id;
    req.session.username = user.username;

    res.json({ success: true, message: 'Login successful' });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});





router.get('/logout', (req, res) => {
  
  req.session.destroy(err => {
    if (err) console.error('Session destroy error:', err);
    res.redirect('/login');
  });
});


module.exports = router;
