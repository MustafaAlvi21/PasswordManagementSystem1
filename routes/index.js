var express = require('express');
var router = express.Router();
var userDataModule = require('../modules/user');
var password_categoriesDataModel = require('../modules/password_categories');
var addPassword_DB_DataModel = require('../modules/addPassword_db');
const bodyparser = require('body-parser')
var urlencodedParser = bodyparser.urlencoded({extended: false});
var jsonParser = bodyparser.json();
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');


// -------------------------------------------------------------------------------

// settingUp local-storage
if(typeof localStorage === 'undefined' || localStorage === null){
  var localStorage = require('node-localstorage').LocalStorage;
  localStorage = new localStorage('./scratch');
}

// ----------------------------------------------------------------------

/* Stopping user to access pages without login.  */
function userAccess(req, res, next){
 var userToken = localStorage.getItem('userToken');
 try {
    var decode = jwt.verify(userToken, 'loginToken');
 } catch (error) {
   res.redirect('/login')
 }

  next();
}


// ----------------------------------------------------------------------
/* Home page*/ 
router.get('/', function(req, res){
  var loginUser = localStorage.getItem('loginUser');
  var loginUser_id = localStorage.getItem('loginUser_id');
  var UserloginCount = localStorage.getItem('UserloginCount');
  var UserlastLogin = localStorage.getItem('UserlastLogin');
  if (loginUser_id != null){
  var d = Date(Date.now()); 
  const currentDate = d.toString();
   var a = userDataModule.find({User_id: loginUser_id});
   a.exec(function(err, data){
    if (err) throw err;
    var loginCount = data.state;
    console.log('loginCount: ' + loginCount)
    let getCategory = userDataModule.findByIdAndUpdate(loginUser_id,
      {
        loginCount: parseInt(UserloginCount) + 1,
        lastLogin: UserlastLogin,
        currentLogin: currentDate,
      });
   getCategory.exec(function(err, data){
     if (err) throw err;
   }); 
    }); 
      console.log('currentDate : ' + currentDate)
};
  console.log('loginUser : ' +loginUser )
  console.log('loginUser_id : ' + loginUser_id)  
  console.log('UserloginCount : ' + typeof parseInt(UserloginCount))  
  
  res.render('home', {title: 'Home', msg: '', loginUser: loginUser});
});

// ----------------------------------------------------------------------

/* GET login page. */
router.get('/login', function(req, res, next) {
  var userToken = localStorage.getItem('userToken');
  var loginUser_id = localStorage.getItem('loginUser_id');
  if(userToken){
    res.redirect('/dashboard');
  } else{
  res.render('login', { title: 'Password Management System', msg: 'To access, you have to login',});
  }
});

/* POST login page. */
router.post('/login', function(req, res, next) {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;

 var checkUser = userDataModule.findOne({ email: enteredEmail });
 checkUser.exec(function (err, data) {
      if (err) throw err;
        var getPasswordFromDB = data.password;
        var getUserId = data._id;
        if (bcrypt.compareSync(enteredPassword, getPasswordFromDB)){
          var token = jwt.sign({ userId: getUserId }, 'loginToken');
          localStorage.setItem('userToken', token);
          localStorage.setItem('loginUser', data.userName);
          localStorage.setItem('loginUser_id', data._id);
          localStorage.setItem('UserloginCount', data.loginCount);
          if(data.currentLogin == null || data.currentLogin==undefined){
            localStorage.setItem('UserlastLogin', 'null');
            console.log('usdefined 123')
          }else{
            localStorage.setItem('UserlastLogin', data.currentLogin);
            console.log('NOT usdefined')
          }
          
          res.redirect('/');
        } else {
          res.render('login', { title: 'Password Management System', msg: "Credintials don't match."});
        }
    });
});
// ----------------------------------------------------------------------

/* dashboard page. */ 
  router.get('/dashboard',userAccess, function(req, res){
  var loginUser = localStorage.getItem('loginUser');
  var loginUser_id = localStorage.getItem('loginUser_id');
  userDataModule.findOne({_id: loginUser_id}).exec(function(err, data1){
    if(err) throw err;
  addPassword_DB_DataModel.find({User_id: loginUser_id}).exec(function(err, data2){
    if(err) throw err;
    console.log('data1 : ' + data1 )
    console.log('data2 : ' + data2 )
    res.render('dashboard', {title: 'Dashboard', msg: 'helloo 123', loginUser: loginUser, record: data1, data: data2 });
  });
  });
  // console.log('loginUser : ' +loginUser )
  // console.log('loginUser_id : ' + loginUser_id)  
  
});

// ----------------------------------------------------------------------

/* Logout */
router.get('/logout', function(req, res){
  localStorage.removeItem('userToken');
  localStorage.removeItem('loginUser');
  localStorage.removeItem('loginUser_id');

  res.redirect('/');

}) 
// ----------------------------------------------------------------------

    /* Checking db existing email. */ 
function checkExistingEmailFromDB(req, res, next){
  var enteredEmail = req.body.email;
  var checkExistingEmailFromDB = userDataModule.findOne({email: enteredEmail});
  checkExistingEmailFromDB.exec((err, data) => {
    if (err) throw err; 
    if (data){
      return   res.render('signup', { title: 'Password Management System', msg:"Email exist in our data"});
    }
    next();
  });
};

/* Checking db existing username. */ 
function checkExistingUsernameFromDB(req, res, next){
  var enteredUsername = req.body.username;
  var checkExistingEmailFromDB = userDataModule.findOne({userName : enteredUsername});
  checkExistingEmailFromDB.exec((err, data) => {
    if (err) throw err; 
    if (data){
      return   res.render('signup', { title: 'Password Management System', msg:"Username exist in our data"});
    }
    next();
  });
};
    /* GET SignUp page. */
router.get('/signup', function(req, res, next) {
  var userToken = localStorage.getItem('userToken');
  if(userToken){
    res.redirect('/');
  } else {
  res.render('signup', { title: 'Password Management System', msg:""});
  }
});

    /* POST SignUp page. */
router.post('/signup', checkExistingUsernameFromDB, checkExistingEmailFromDB, function(req, res, next) {
  const username =  req.body.username;
  const email =  req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  const state =  req.body.state;
  const city =  req.body.city;
  var d = Date(Date.now()); 
  const currentDate = d.toString();
  
  const userDetails = new userDataModule({
    userName : username,
    email : email,
    password : password,
    state : state,
    city : city,
    creationDate : currentDate,
    loginCount : 0,
    recentLogin :currentDate,
  });
  userDetails.save((err, data) => {
    if(err) throw err;
    res.render('login', { title: 'Password Management System', msg:"Successfully registered."});
  });
});

// ----------------------------------------------------------------------

/* GET Home/category page. */
router.get('/category-password', userAccess, function(req, res, next) {
  res.render('password_categories', { title: 'Password Management System' });
});
// ----------------------------------------------------------------------

/* GET Add new category page. */
router.get('/Add-category',   function(req, res, next) {
  var loginUser = localStorage.getItem('loginUser');
  res.render('AddNewCategory', { title: 'Add New Category', loginUser: loginUser, msg:"" });
});

/* Checking db existing category. */ 
function checkExistingCategoryFromDB(req, res, next){
  var loginUser = localStorage.getItem('loginUser');
  var enteredCategory = req.body.passwordCategory;
  var checkExistingCategoryFromDB = password_categoriesDataModel.findOne({password_categoriesName : enteredCategory});
  checkExistingCategoryFromDB.exec((err, data) => {
    if (err) throw err; 
    if (data){
      return   res.render('AddNewCategory', { title: 'Add New Category', loginUser: loginUser, msg:"Category exist in our data"});
    }
    next();
  });
};
    
/* POST Add new category. */
router.post('/Add-category', userAccess, checkExistingCategoryFromDB, function(req, res, next) {
  var loginUser = localStorage.getItem('loginUser');
  var loginUser_id = localStorage.getItem('loginUser_id');
 console.log('loginUser_id:  '+ loginUser_id)
  const passwordCategore = req.body.passwordCategory;

  const passowrdCategory = new password_categoriesDataModel({
    password_categoriesName : passwordCategore,
    User_id : loginUser_id,
  });
  passowrdCategory.save(function(err, data1){
    if(err) throw err;
    console.log('added category')
    res.render('AddNewCategory', { title: 'Add New Category', msg:"Successfully Added.", loginUser: loginUser,});
  }); 
});

// delete Password Categories. 
router.get('/view-all-category/remove/:id', function(req, res, next){
  let id = req.params.id;
  console.log('category id: ' + id)
  let deleteCategory = password_categoriesDataModel.findByIdAndDelete(id);
  deleteCategory.exec(function(err){
    if (err) throw err;
    res.redirect('/view-all-category');
  })
})


// edit/update Password Categories. 
router.get('/view-all-category/edit/:id',userAccess, function(req, res, next){
  let id = req.params.id;
  var loginUser = localStorage.getItem('loginUser');
  let getCategory = password_categoriesDataModel.findById(id);
  getCategory.exec(function(err, data){
    if (err) throw err;
    console.log(data)
    res.render('edit_passwordCategory',  {title: 'Update Category', loginUser: loginUser, msg: '', record: data, id: id});
  });
});

/* Checking db existing category for updating category. */ 
  function checkExistingCategoryFromDBForupdate(req, res, next){
    var enteredcategory = req.body.updateCategory;
    var id = req.body.id;
    var checkExistingCategoryFromDB = password_categoriesDataModel.findOne({password_categoriesName : enteredcategory});
    checkExistingCategoryFromDB.exec((err, data) => {
      if (err) throw err; 
      if (data){
        return res.render('edit_passwordCategory', { title: 'Password Management System', msg:"Category exist in our data", record: data, id: id});
      }
      next();
    });
  }

router.post('/view-all-category/edit/', checkExistingCategoryFromDBForupdate, function(req, res, next){
  var id = req.body.id;
  let categoryName = req.body.updateCategory;
  console.log('id123:  ' + id)
  console.log('categoryName:  ' + categoryName)
  let getCategory = password_categoriesDataModel.findByIdAndUpdate(id,
     {
       password_categoriesName: categoryName
     });
  getCategory.exec(function(err, data){
    if (err) throw err;
    res.redirect('/view-all-category');
  });
});

// edit/update Password Categories   ends here.

// ----------------------------------------------------------------------

/* GET view all category page. */
router.get('/view-all-category', userAccess,  function(req, res, next) {
   var loginUser = localStorage.getItem('loginUser');
   var categoryInDB = password_categoriesDataModel.find({});
   categoryInDB.exec(function(err, data){
     if (err) throw err;
     res.render('viewAllCategory', { title: 'View all categore', loginUser: loginUser, record: data});
   })
});
// ----------------------------------------------------------------------

/* GET Add new password page. */
router.get('/Add-password', userAccess,  function(req, res, next) {
  let nameOfcategory = password_categoriesDataModel.find({});
  var loginUser = localStorage.getItem('loginUser');
  nameOfcategory.exec(function(err, data){
    if(err) throw err;
    res.render('addNewPassword', { title: 'Add New Password', loginUser: loginUser,msg: '', records: data });
  });  
});

/* POST Add new password page. */
router.post('/Add-password', userAccess,  function(req, res, next) {
var loginUser = localStorage.getItem('loginUser');
const passwordCategory1 = req.body.passwordCategoryName;
const emailAddress1 = req.body.EmailAddress;
const userPassword1 = req.body.userPasswordName;
const ReEmailAddress = req.body.RecoveryEmailAddress;
const passwordDetails1 = req.body.passwordDetailsName;
const d = Date(Date.now()); 
const currentDate1 = d.toString();
var loginUser_id = localStorage.getItem('loginUser_id');
console.log('user di from post method: ' + loginUser_id)
let nameOfcategory = password_categoriesDataModel.find({});

let AddPassword = new addPassword_DB_DataModel({
  password_category: passwordCategory1,
  EmailAddress: emailAddress1,
  userPassword: userPassword1,
  RecoveryEmailAddress: ReEmailAddress,
  passwordDetails: passwordDetails1,
  creationDate : currentDate1,
  User_id : loginUser_id,
});

AddPassword.save(function(err, data){
  nameOfcategory.exec(function(err, data2){
    if(err) throw err;
    res.render('addNewPassword', { title: 'Add New Password', loginUser: loginUser, msg: 'Password added successfully', records: data2});
  });  
  });  
});

//  edit/update Password and Details. 
router.get('/view-all-password/edit/:id',userAccess, function(req, res, next){
  let id = req.params.id;
  var loginUser = localStorage.getItem('loginUser');
  let getpassword = addPassword_DB_DataModel.findById(id);
  getpassword.exec(function(err, data){
    if (err) throw err;
    console.log('data:  ' + data)
    res.render('edit_passwordDetails',  {title: 'Update Password',loginUser: loginUser, msg: '', record: data, id: id});
  });
});
  
/* Checking db existing password for updating category. */ 
  // function checkExistingPasswordFromDBForupdate(req, res, next){
  //   var enteredPassword = req.body.updatePassword;
  //   var id = req.body.id;
  //   var checkExistingPasswordFromDB = addPassword_DB_DataModel.findOne({userPassword  : enteredPassword});
  //   checkExistingPasswordFromDB.exec((err, data) => {
  //     if (err) throw err; 
  //     if (data){
  //       return res.render('edit_passwordDetails', { title: 'Update Password', msg:"Passowrd exist in our data", record: data, id: id});
  //     }
  //     next();
  //   });
  // }

router.post('/view-all-password/edit/', function(req, res, next){
  var id = req.body.id;
  let category = req.body.updatepassword_category;
  let updateEmail = req.body.updateEmailAddress;
  let Password = req.body.updatePassword;
  let updateRe_Email = req.body.updateRecoveryEmail;
  let passwordDetails = req.body.passwordDetailsName;
  // console.log('id123:  ' + id)
  // console.log('categoryName:  ' + categoryName)
  let getCategory = addPassword_DB_DataModel.findByIdAndUpdate(id,
     {
      password_category : category,
      EmailAddress : updateEmail,
      userPassword  : Password,
      RecoveryEmailAddress   : updateRe_Email,
      passwordDetails   : passwordDetails,
     });
  getCategory.exec(function(err, data){
    if (err) throw err;
    res.redirect('/view-all-password');
  });
});

// edit/update Password Categories   ends here.

// delete Password and Details. 
router.get('/view-all-password/remove/:id', function(req, res, next){
  let id = req.params.id;
  console.log('category id: ' + id)
  let deletePasswordDetails = addPassword_DB_DataModel.findByIdAndDelete(id);
  deletePasswordDetails.exec(function(err){
    if (err) throw err;
    res.redirect('/view-all-password');
  })
})

// ----------------------------------------------------------------------

/* GET view all password page. */
router.get('/view-all-password', userAccess,  function(req, res, next) {
  var loginUser = localStorage.getItem('loginUser');
  var loginUser_id = localStorage.getItem('loginUser_id');
  var categoryInDB = addPassword_DB_DataModel.find({User_id: loginUser_id});
  categoryInDB.exec(function(err, data){
    if (err) throw err;
  // res.render('viewAllPassword', { title: 'Add New Category' });
    res.render('viewAllPassword', { title: 'Here all your passwords.', loginUser: loginUser, record: data});
  })
});


// ----------------------------------------------------------------------
module.exports = router;
