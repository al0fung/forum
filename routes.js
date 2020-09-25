var router = require('express').Router();
var User = require('./models/user.js');
var Post = require('./models/forum.js').Post;
var Thread = require('./models/forum.js').Thread;
var Board = require('./models/forum.js').Board;
var middleware = require('./middleware.js');

router.get('/', function(req, res){
 return res.render('index', {title: 'Home'});
});

router.get('/register', middleware.alreadyLoggedIn, function(req, res){
 return res.render('register', {title: 'Registration'});
});

router.post('/register', middleware.alreadyLoggedIn, function(req, res, next){
 if(!req.body.username || !req.body.email || !req.body.password || !req.body.confirmPassword){
  var err = new Error('All fields have to be filled.');
  err.status = 400;
  return next(err);
 }
 if(!req.body.email.match('.*@.*')){
  var err = new Error('Invalid email address.');
  err.status = 400;
  return next(err);
 }
 if(req.body.password != req.body.confirmPassword){
  var err = new Error('Passwords have to match.');
  err.status = 400;
  return next(err);
 }
 User.findOne({username: req.body.username}, function(error, results){
  if(error){
   return next(error);
  }
  if(results){
   var err = new Error('The username you chose had already been taken. Please choose another username.');
   err.status = 400;
   return next(err);
  }
  User.findOne({email: req.body.email}, function(error, results){
   if(error){
    return next(error);
   }
   if(results){
    var err = new Error('The email you entered had already been registered. Please choose another email.');
    err.status = 400;
    return next(err);
   }
   var newUser = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
   });
   newUser.save(function(err, newUser){
    if(err){
     return next(err);
    }
   });
   return res.redirect('/');
  });
 });
});

router.get('/login', middleware.alreadyLoggedIn, function(req, res, next){
 return res.render('login', {title: 'Log In'});
});

router.post('/login', middleware.alreadyLoggedIn, function(req, res, next){
 if(!req.body.username || !req.body.password){
  var err = new Error('Username and password are required for login.');
  err.status = 401;
  return next(err);
 }
 User.authenticate(req.body.username, req.body.password, function(error, userId){
  if(error){
   return next(error);
  }
  req.session.userId = userId;
  req.session.save(function(err){
   if(err){
    return next(err);
   }
   return res.redirect('/');
  });
 });
});

router.get('/logout', middleware.requiresLogin, function(req, res, next){
 req.session.destroy(function(err){
  if(err){
   return next(err);
  }
  return res.redirect('/');
 });
});

router.get('/boards', middleware.requiresLogin, function(req, res, next){
 Board.find({}, '_id title', {sort: {title: 1}}, function(err2, boards){
  if(err2){
   return next(err2);
  }
  res.locals.boards = boards;
  return res.render('boards', {title: 'Forum'});
 });
});

router.post('/boards', middleware.requiresLogin, function(req, res, next){
 if(!req.body.boardTitle){
  var err = new Error('Board title cannot be empty.');
  err.status = 400;
  return next(err);
 }
 Board.findOne({title: req.body.boardTitle}, function(error, results){
  if(error){
   return next(error);
  }
  if(results){
   var err = new Error('The board title you chose had already been taken. Please choose another one.');
   err.status = 400;
   return next(err);
  }
  var newBoard = new Board({
   title: req.body.boardTitle,
   threads: []
  });
  newBoard.save(function(err, newBoard){
   if(err){
    return next(err);
   }
   return res.redirect('back');
  });
 });
});

router.param('bID', function(req, res, next, bID){
 Board.findOne({_id: bID}, '_id title threads', function(err, board){
  if(err){
   return next(err);
  }
  if(!board){
   var error = new Error('The requested board does not exist');
   error.status = 404;
   return next(error);
  }
  req.board = board;
  res.locals.board = board;
  next();
 });
});

router.get('/boards/:bID/threads', middleware.requiresLogin, function(req, res, next){
 return res.render('threads', {title: req.board.title});
});

router.post('/boards/:bID/threads', middleware.requiresLogin, function(req, res, next){
 if(!req.body.threadTitle || !req.body.threadContent){
  var err = new Error('Thread title and content cannot be empty.');
  err.status = 400;
  return next(err);
 }
 Board.findOne({_id: req.board._id, 'threads.title': req.body.threadTitle}, function(error, result){
  if(error){
   return next(error);
  }
  if(result){
   var err = new Error('The thread title you chose had already been taken. Please choose another one.');
   err.status = 400;
   return next(err);
  }
  var newThread = new Thread({
   title: req.body.threadTitle,
   dateUpdated: Date.now(),
   posts: [{
    content: req.body.threadContent,
    author: res.locals.currentUser,
    dateCreated: Date.now()
   }]
  });
  req.board.threads.push(newThread);
  req.board.save(function(err, board){
   if(err){
    return next(err);
   }
   return res.redirect('back');
  });
 });
});

router.param('tID', function(req, res, next, tID){
 req.thread = req.board.threads.id(tID);
 Post.populate(req.thread.posts, {path: 'author'}, function(err, posts){
  if(err){
   return next(err);
  }
  res.locals.thread = req.thread;
  res.locals.posts = posts;
  next();
 });
});

router.get('/boards/:bID/threads/:tID/posts', middleware.requiresLogin, function(req, res, next){
 return res.render('posts', {title: req.thread.title});
});

router.post('/boards/:bID/threads/:tID/posts', middleware.requiresLogin, function(req, res, next){
 if(!req.body.postContent){
  var err = new Error('Post content cannot be empty.');
  err.status = 400;
  return next(err);
 }
 var newPost = new Post({
  content: req.body.postContent,
  author: res.locals.currentUser,
  dateCreated: Date.now()
 });
 req.thread.posts.push(newPost);
 req.board.save(function(err, board){
  if(err){
   return next(err);
  }
  return res.redirect('back');
 });
});

router.param('pID', function(req, res, next, pID){
 req.post = req.thread.posts.id(pID);
 Post.populate(req.post, {path: 'author'}, function(err, post){
  if(err){
   return next(err);
  }
  res.locals.post = post;
  next();
 });
});

router.patch('/boards/:bID/threads/:tID/posts/:pID', middleware.requiresLogin, function(req, res, next){
 req.post.content = req.body.editedPost;
 req.post.dateUpdated = Date.now();
 req.board.save(function(err, board){
  if(err){
   return next(err);
  }
  return res.end();
 });
});

router.delete('/boards/:bID/threads/:tID/posts/:pID', middleware.requiresLogin, function(req, res, next){
 req.post.deleted = true;
 req.board.save(function(err, board){
  if(err){
   return next(err);
  }
  return res.end();
 });
});

module.exports = router;