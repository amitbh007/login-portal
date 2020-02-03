const express=require("express");
const bodyParser=require("body-parser");
const session=require("express-session");
const mongoose =require("mongoose");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const LocalStrategy = require('passport-local').Strategy;

const app=express();
mongoose.connect("mongodb://localhost:27017/testDB",{useNewUrlParser: true,useUnifiedTopology: true,useFindAndModify: false});
mongoose.set('useCreateIndex', true);

app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    secret:"name",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());


//Schemas
const localuserSchema= new mongoose.Schema({
    username:String,
    name:String,
    password:String,
    type:String
});
const generaleuserSchema= new mongoose.Schema({
    username:String,
    password:String,
    company:String,
    type:String
});

//plugins
generaleuserSchema.plugin(passportLocalMongoose);
localuserSchema.plugin(passportLocalMongoose);

//models
const Guser=mongoose.model("gpeople",generaleuserSchema);
const Luser=mongoose.model("lpeople",localuserSchema);

//Strategies
passport.use('local-user', new LocalStrategy({
    usernameField: 'username',
    // this is the virtual field on the model
  },
  function(username, password, done) {
    Luser.findOne({
      username: username
    }, function(err, user) {
      if (err) return done(err);

      if (!user) {
        return done(null, false,);
      }
      if (!user.authenticate(password)) {
        return done(null, false,);
      }
      return done(null, user);
    });
  }
));

passport.use('general-user', new LocalStrategy({
    usernameField: 'username',
    // this is the virtual field on the model
  },
  function(username, password, done) {
    Guser.findOne({
      username: username
    }, function(err, user) {
      if (err) return done(err);

      if (!user) {
        return done(null, false,);
      }
      if (!user.authenticate(password)) {
        return done(null, false,);
      }
      return done(null, user);
    });
  }
));


//serialize/deserialize

passport.serializeUser(function(user, done) {
    done(null, {id:user.id,type:user.type});
});

passport.deserializeUser(function(usr, done) {
    if(usr.type==="Luser"){
        Luser.findById(usr.id, function(err, user) {
            done(err, user);
        });
    }
    else{
        Guser.findById(usr.id, function(err, user) {
            done(err, user);
        });
    }
});



//routes
app.get("/",(req,res)=>{
    res.sendFile(__dirname+"/choice.html");
});

app.get("/type/:choice",function(req,res){
    const choice=req.params.choice;
    if(choice==="L"){
        res.sendFile(__dirname+"/Lsignup.html");
    }
    else{
        res.sendFile(__dirname+"/Gsignup.html");
    }
});

app.post("/signup/:type",function(req,res){
    const type=req.params.type;
    var path="";
    var user={};

    if(type==="Luser"){
        path="local-user";
        user={
            username:req.body.username,
            name:req.body.name,
            type:type
        }
    }
    else{
        path="general-user";
        user={
            username:req.body.username,
            company:req.body.company,
            type:type
        }
    }

    eval(type).register(user,req.body.password,function(err,usar){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate(path,function(err,usr,info){
                if(err){
                    console.log("err hai")
                    console.log(err);
                    return;
                }
                if(!usr){
                    console.log("usr not present");
                    return usr;
                }

                req.logIn(usr, function(err) {
                    if (err)  return next(err); 
                    return res.redirect("/secret");
                });

            })(req, res, function(){
                console.log("pass-errr");
            });
        }
    })
});

app.get("/secret",function(req,res){
    if(req.isAuthenticated()){
        res.sendFile(__dirname+"/secret.html");
    }
    else{
        res.sendFile(__dirname+"/signup.html");
    }
});



app.listen(3000,function(req,res){
    console.log("server running");
});
