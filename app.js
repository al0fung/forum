var express = require('express');
var app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/forum');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function(){
 var session = require('express-session');
 var MongoStore = require('connect-mongo')(session);
 app.use(session({
  secret: 'This forum is underconstruction but is cool.',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
   mongooseConnection: db
  })
 }));

 app.use(function(req, res, next){
  res.locals.currentUser = req.session.userId;
  return next();
 });

 var router = require('./routes.js');
 app.use('/', router);

 app.use(function(req, res, next){
  var err = new Error('Resource not found.');
  err.status = 404;
  return next(err);
 });

 app.use(function(err, req, res, next){
  res.status(err.status || 500);
  return res.render('error', {message: err.message});
 });

 app.listen(3000, function(){
  console.log('Forum app is listening on port 3000.');
 });
});