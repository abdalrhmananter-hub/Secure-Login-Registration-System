
function requireLogin(req, res, next) {
  
  if (req.session && req.session.userId) {
    // User is logged in – continue to the actual route handler
    return next();
  }

 
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
}


function redirectIfLoggedIn(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/home');
  }
  next();
}

module.exports = { requireLogin, redirectIfLoggedIn };
