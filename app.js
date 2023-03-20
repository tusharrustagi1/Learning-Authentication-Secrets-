require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const app=express();
const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const saltRounds=10;
app.use(express.static("public"));
app.set("view engine",'ejs');
app.use(bodyParser.urlencoded({extended:true}));
mongoose.connect("mongodb://localhost:27017/userDB",{usenewUrlParser:true});
const userSchema=new mongoose.Schema({
    email:String,
    password:String
});
const User=new mongoose.model("User",userSchema);
app.get("/",function(req,res){
    res.render("home");
});
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});
app.post("/register",function(req,res)
{
    bcrypt.hash(req.body.password,saltRounds,function(err,hash)
    {   
        const newUser=new User({
            email:req.body.username,
            password:hash
        });
        newUser.save().then(function(result){
            res.render("secrets");
        }).then(function(err){
            console.log(err);
        });
    });
});
app.post("/login",function(req,res)
{
    const username=req.body.username;
    const password=req.body.password;
    User.findOne({email:username}).then(function(result)
    {
        if(result)
        {
            bcrypt.compare(password,result.password,function(err,results)
            {
                if(results===true)
                {
                    res.render("secrets");
                }
            });           
        }
    }).catch(function(error)
    {
        console.log(error);
    });
});
app.listen(3000,function(req,res)
{
    console.log("server started at port 3000");
});