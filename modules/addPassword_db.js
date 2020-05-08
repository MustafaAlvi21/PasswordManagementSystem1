var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/Password_Management_System', {useNewUrlParser: true});
var db = mongoose.connection;

var addPassword_DB_Schema = new mongoose.Schema(
    {
      password_category: {type: String, required: true},
      EmailAddress: {type: String, required: true},
      userPassword: {type: String, required: true},
      RecoveryEmailAddress: {type: String },
      passwordDetails: {type: String },
      creationDate: {type: String},
      User_id: {type: String, required: true },
    }
  );

var addPassword_DB_DataModel = mongoose.model('addPassword_db', addPassword_DB_Schema);
module.exports =  addPassword_DB_DataModel;

