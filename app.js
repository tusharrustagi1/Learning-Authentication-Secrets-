require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const app=express();
const mongoose=require('mongoose');
const session=require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
const GoogleStrategy=require('passport-google-oauth20').Strategy;
const findOrCreate=require('mongoose-findorcreate');
const FacebookStrategy=require('passport-facebook');
app.use(express.static("public"));
app.set("view engine",'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({secret:"our little secret.",resave:false,saveUninitialized:false}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/userDB",{usenewUrlParser:true});
const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User=new mongoose.model("User",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
});
passport.deserializeUser(function(user, cb) {
process.nextTick(function() {
    return cb(null, user);
});
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
    async function(accessToken,refreshToken,profile,done)
    {
        console.log(profile);
        try{
            let user=await User.findOne({googleId:profile.id});
            if(!user)
            {
                const username=Array.isArray(profile.emails)&&profile.emails.length>0?profile.emails[0].value.split("@")[0]:'';
                const newUser=new User({
                    username:profile.displayName,
                    googleId:profile.id
                });
                user=await newUser.save();
            }
            return done(null,user);
        }
        catch(err)
        {
            return done(err);
        }
    }
  ));
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
    async function(accessToken,refreshToken,profile,done)
    {
        console.log(profile);
        try{
            let user=await User.findOne({facebookId:profile.id});
            if(!user)
            {
                const username=Array.isArray(profile.emails)&&profile.emails.length>0?profile.emails[0].value.split("@")[0]:'';
                const newUser=new User({
                    username:profile.displayName,
                    facebookId:profile.id
                });
                user=await newUser.save();
            }
            return done(null,user);
        }
        catch(err)
        {
            return done(err);
        }
    }
));
app.get("/",function(req,res){
    res.render("home");
});
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});
app.get("/secrets",function(req,res)
{
    if(req.isAuthenticated())
    {
        res.render("secrets");
    }
    else
    {
        res.redirect("/login");
    }
});
app.get("/logout",function(req,res)
{
    req.logout(function(err)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.redirect("/");
        }
    });
});
app.get("/auth/google",passport.authenticate("google",{scope:['profile']}));
app.get('/auth/google/secrets', passport.authenticate('google', { failureRedirect: '/login' }),function(req, res) {
    res.redirect('/secrets');
  });
  app.get('/auth/facebook',passport.authenticate('facebook'));

app.get('/auth/facebook/callback',passport.authenticate('facebook', { failureRedirect: '/login' }),function(req, res) {
    res.redirect('/secrets');
  });
app.post("/register",function(req,res)
{
    User.register({username:req.body.username},req.body.password,function(err,user)
    {
        if(err)
        {
            console.log(err);
            res.redirect("/register");
        }
        else
        {
            passport.authenticate("local")(req,res,function()
            {
                res.redirect("/secrets");
            });
        }
    });
});
app.post("/login",function(req,res)
{
    const user=new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user,function(err)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            passport.authenticate("local")(req,res,function()
            {
                res.redirect("/secrets");
            });
        }
    }) 
});
app.listen(3000,function(req,res)
{
    console.log("server started at port 3000");
});