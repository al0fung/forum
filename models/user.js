var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var userSchema = mongoose.Schema({
 username: {
  type: String,
  required: true,
  unique: true
 },
 email: {
  type: String,
  required: true,
  unique: true
 },
 password: {
  type: String,
  required: true
 }
});

userSchema.statics.authenticate = function(loginUsername, loginPassword, callback){
 this.findOne({username: loginUsername}, function(err, result){
  if(err){
   return callback(err);
  }
  if(!result){
   var error = new Error('Incorrect username or password or both.');
   error.status = 401;
   return callback(error);
  }
  bcrypt.compare(loginPassword, result.password, function(error, result2){
   if(error){
    return callback(error);
   }
   if(!result2){
    var error = new Error('Incorrect username or password or both.');
    error.status = 401;
    return callback(error);
   }
   return callback(undefined, result._id);
  });
 });
};

userSchema.pre('save', function(next){
 var user = this;
 bcrypt.hash(this.password, 10, function(err, hash){
  if(err){
   return next(err);
  }
  user.password = hash;
  next();
 });
});

var User = mongoose.model('User', userSchema);

module.exports = User;