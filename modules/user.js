var mongoose = require('mongoose');
mongoose.connect( process.env.MONGODB_URI  ||  'mongodb://localhost/Password_Management_System', {useNewUrlParser: true, useCreateIndex: true});
// mongoose.connect('process.env.MONGODB_URI    ', {useNewUrlParser: true, useCreateIndex: true});
var db = mongoose.connection;

var userSchema = new mongoose.Schema(
    {
     userName: {type: String, required: true, index: { unique: true} },
     email: {type: String, required: true, index: { unique: true} },
     password: {type: String, required: true },
     state: {type: String, required: true },
     city: {type: String, required: true },
     creationDate: {type: String,},
     loginCount: {type: Number,},
     lastLogin: {type: String,},
     currentLogin: {type: String,},
    }
  );

var userDataModel = mongoose.model('users', userSchema);
module.exports =  userDataModel;
