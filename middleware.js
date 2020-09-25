function alreadyLoggedIn(req, res, next){
 if(req.session.userId){
  return res.redirect('/');
 }
 return next();
}

function requiresLogin(req, res, next){
 if(!req.session.userId){
  var err = new Error('You must be logged in to view this page');
  err.status = 403;
  return next(err);
 }
 return next();
}

module.exports.alreadyLoggedIn = alreadyLoggedIn;
module.exports.requiresLogin = requiresLogin;