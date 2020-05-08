var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/Password_Management_System', {useNewUrlParser: true});
var db = mongoose.connection;

var password_categoriesSchema = new mongoose.Schema(
    {
        password_categoriesName: {type: String, required: true, index: { unique: true} },
        User_id: {type: String, required: true },
    }
  );

var password_categoriesDataModel = mongoose.model('password_categories', password_categoriesSchema);
module.exports =  password_categoriesDataModel;


