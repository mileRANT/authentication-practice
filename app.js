//jshint esversion:6
require('dotenv').config(); //environment variables
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption"); //LEVEL 2 - Database Encryption
// const md5 = require("md5"); //Level 3: Hash
//instead of md5 which is commonplace, can use BCRYPT which is slower to crack
// LEVEL 4 - Bcrypt [hashing] and Salting
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

//LEVEL 5 Sessions and cookies using Passport. Also hashes and salts using passport so remove level 4
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));

//LEVEL 5 setting up session, passport, and using session with the passport
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//connect to mongodb
mongoose.connect("mongodb://127.0.0.1:27017/userDB");


//the below is too simple. its just a javascript object, so we need to use a mongoose.Schema object instead
// const userSchema = {
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//dropped table, removed secret and changed key
//const secret = "SECRETKEYTHATSHOULDNOTBESHOWNTOANYONE";

//need to add plugin before creating the mongoose.model schema
//LEVEL 2 with environment variable
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]}); //AES Encryption done with this line. mongoose will do the work for us
userSchema.plugin(passportLocalMongoose); //LEVEL 5 - used for hashing and salting

//^ by having secret and this encryption package here, someone whom has access to both will be able to recreate and decrypt passwords

//for multiple field encryptions, use this
// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password", "moretoencrypt"]});

const User = new mongoose.model("User", userSchema);

//LEVEL 5 - Serialize and Deserialize strategy. passportLocalMongoose doing a lot of the work
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

async function addUser(newUser){
    const addedUser = await newUser.save();
}

async function loginUser(username){
    const findUser = await User.findOne({email: username});
    return findUser;
}

app.get("/", function(req,res){
    res.render("home");
});

app.get("/login", function(req,res){
    res.render("login");
});

app.post("/login", function(req,res){
    // const username = req.body.username;
    // const password = req.body.password; //LEVEL 4 use bcrypt with the plain text
    // const password = md5(req.body.password); //LEVEL 3

    //Level 5
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if (err){
            console.log(err)
        } else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            });
        }
    });
    
    //LEVEL 3-4 below
    // try{  
    //     loginUser(username).then(function(foundUser){
    //         if (foundUser){
    //             // if (foundUser.password === password){
    //             bcrypt.compare(password, foundUser.password, function(err, result){
    //                 if (result == true){
    //                     res.render("secrets");
    //                 }else {
    //                     console.log("incorrect password")
    //                 };
    //             })
    //         };
    //     });
    // } catch(err) {
    //     console.log(err)
    // };


    // User.findOne({email: username}, function(err, foundUser){
    //     if(err) {
    //         console.log(err)
    //     } else {
    //         if (foundUser) {
    //             if (foundUser.password === password){
    //                 res.render("secrets");
    //             }
    //         }
    //     }
    // });
});

app.get("/register", function(req,res){
    res.render("register");
});

app.post("/register", function(req,res){

    //LEVEL 5 - using Passports
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err){
            console.log(err);
            res.redirect("/register");
            
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");   
            })
        }
    })
    //LEVEL 2-3-4 below
    // bcrypt.hash(req.body.password, saltRounds, function(err,hash){
    //     const newUser = new User({
    //         email: req.body.username,
    //         // password: req.body.password
    //         // password: md5(req.body.password) //LEVEL 3 - Hash
    //         password: hash
    //     });
    //     // console.log(newUser);
    
    // //we need to be able to catch this error and not show our secrets
    //     try{
    //         addUser(newUser).then(function(){
    //             res.render("secrets");
    //         });
    //     } catch(err) {
    //         console.log(err);
    //     };
    // });



    //angela yu's version below which no longer works as callback is no longer supported by mongoose
    // newUser.save(function(err){
    //     if (err){
    //         console.log(err);
    //     } else {
    //         res.render("secrets");
    //     }
    // });
    // res.render("secrets");
});

app.get("/secrets", function(req, res){
    //we now have a secrets route as we can now check if user is logged in [using passports/sessions]
    if (req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("login");
    }
});

//now that we have authentication, create a logout route
app.get("logout", function(req, res){
    req.logout();
    res.redirect("/")
});


app.listen(3000, function(){
    console.log("Server started on port 3000")
});