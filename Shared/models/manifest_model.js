var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var manifestSchema = new Schema({
  name: String,
  version: String,
  url: String
});

module.exports = mongoose.model('manifests', manifestSchema); 