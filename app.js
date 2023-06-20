//jshint esversion:6
require('dotenv').config(); //environment variables
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption"); //LEVEL 2 - Database Encryption
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));

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
//LEVEL 2 - Database Encryption
//userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]}); //AES Encryption done with this line. mongoose will do the work for us
//LEVEL 2 with environment variable
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]}); //AES Encryption done with this line. mongoose will do the work for us
//^ by having secret and this encryption package here, someone whom has access to both will be able to recreate and decrypt passwords

//for multiple field encryptions, use this
// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password", "moretoencrypt"]});

const User = new mongoose.model("User", userSchema);

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
    const username = req.body.username;
    const password = req.body.password;

    try{  
        loginUser(username).then(function(foundUser){
            if (foundUser){
                if (foundUser.password === password){
                    res.render("secrets");
                }else {
                    console.log("incorrect password")
                };
            };
        });
    } catch(err) {
        console.log(err)
    };
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
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    console.log(newUser);

//we need to be able to catch this error and not show our secrets
    try{
        addUser(newUser).then(function(){
            res.render("secrets");
        });
    } catch(err) {
        console.log(err);
    };


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


app.listen(3000, function(){
    console.log("Server started on port 3000")
});