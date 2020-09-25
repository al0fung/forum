var mongoose = require('mongoose');
var User = require('./user.js');

var postSchema = mongoose.Schema({
 content: {
  type: String,
  required: true
 },
 author: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
 },
 dateCreated: {
  type: Date,
  required: true
 },
 dateUpdated: {
  type: Date
 },
 deleted: {
  type: Boolean
 }
})

var Post = mongoose.model('Post', postSchema);

var threadSchema = mongoose.Schema({
 title: {
  type: String,
  required: true
 },
 dateUpdated: {
  type: Date,
  required: true
 },
 posts: {
  type: [postSchema]
 }
})

var Thread = mongoose.model('Thread', threadSchema);

var boardSchema = mongoose.Schema({
 title: {
  type: String,
  unique: true,
  required: true
 },
 threads: {
  type: [threadSchema]
 }
})

var Board = mongoose.model('Board', boardSchema);

module.exports.Post = Post;
module.exports.Thread = Thread;
module.exports.Board = Board;