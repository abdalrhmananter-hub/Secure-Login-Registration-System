

const express = require('express');
const router  = express.Router();
const path    = require('path');


const { requireLogin } = require('../middleware/auth');



router.get('/', (req, res) => {
  res.redirect('/home');
});



router.get('/home', requireLogin, (req, res) => {
  res.sendFile('home.html', { root: './public' });
});



router.get('/api/session', (req, res) => {
  if (req.session && req.session.userId) {
    
    res.json({
      loggedIn: true,
      username: req.session.username,
      userId:   req.session.userId
    });
  } else {
    res.json({ loggedIn: false });
  }
});


module.exports = router;
