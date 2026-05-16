
require('dotenv').config();

const express = require('express');
const path    = require('path');
const session = require('express-session');
const helmet  = require('helmet');


const { connectDB } = require('./config/database');
const authRoutes  = require('./routes/auth');
const pageRoutes  = require('./routes/pages');


const app  = express();
const PORT = process.env.PORT || 3000;


// helmet() sets many HTTP response headers that protect against
// common web vulnerabilities (clickjacking, MIME sniffing, etc.)
// It also sets a Content-Security-Policy (CSP) header which helps
// mitigate XSS attacks by restricting which scripts can run.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],                         // only load resources from our own origin
      scriptSrc:  ["'self'", "'unsafe-inline'"],      // allow inline scripts (we control them)
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:"],
    }
  }
}));



app.use(express.json());
app.use(express.urlencoded({ extended: true })); // express.urlencoded() – parses traditional HTML form POST bodies


app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production',
  resave: false,            // don't re-save session to store if nothing changed
  saveUninitialized: false, // don't create a session for visitors who aren't logged in
  cookie: {
    secure:   process.env.NODE_ENV === 'production', // send over HTTPS only in production
    httpOnly: true,   // JS on the page CANNOT read this cookie → blocks XSS cookie theft
    maxAge:   1000 * 60 * 60 * 2  // session expires after 2 hours of inactivity
  }
}));


app.use(express.static(path.join(__dirname, 'public')));





app.use('/', pageRoutes); 
app.use('/', authRoutes); 


app.use((req, res) => {
  res.status(404).send('<h1>404 – Page not found</h1><a href="/">Go home</a>');
});


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
});



connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(` Server running at http://localhost:${PORT}`);
    console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
  });
});
