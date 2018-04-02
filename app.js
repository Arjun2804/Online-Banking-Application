var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var app = express();
var session=require('express-session')
var nodemailer = require('nodemailer');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/"
app.set('view engine', 'pug');
app.set('views', './views');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static("public"));
app.use(session({secret:'Ksba'}))
app.all('/',function(req,res){
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("KSBA");
        var ob1={_id:60000004};
        dbo.collection("customers").find(ob1).toArray(function(err, result) {
          if (err) throw err;
         console.log(result[0]);
         console.log(result[0].Address)
         console.log(result[0].Address.Street)
          db.close();

    res.render('homePage.pug');
})
})
});
app.all('/login',function(req,res){
    res.render('login.pug',{msg:""});
})
app.all('/login_submit1',function(req,res){
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("KSBA");
        req.session.cid=parseFloat(req.body.username);
        var ob1={_id:req.session.cid};
        dbo.collection("customers").find(ob1).toArray(function(err, result) {
          if (err) throw err;
          var a=parseFloat("+91"+req.body.mno);
          var b=parseFloat(result[0].RegMob);
          if((result.length>0)&&(result[0].password[2].cur==req.body.psw)&&(b==a))
          {
            req.session.email=result[0].Mail;
            req.session.name=result[0].Address[1].Name[0].First_Name+" "+result[0].Address[1].Name[1].Last_Name
            res.render('login_otp.pug',{Mobile:req.body.mno})
          }
          else
          {
            req.session.destroy(function(err){
                if(err)
                {
                    res.negotiate(err);
                }
              res.render('login.pug',{msg:"Wrong Creditials Entered!"})
            })
          }
          db.close();
             
        });
      });
})
app.all('/login_otp_wrong',function(req,res){
    req.session.destroy(function(err){
        if(err)
        {
            res.negotiate(err);
        }
    res.render('login.pug',{msg:"OTP Incorrect!"});
    })
})
app.all('/login_frgtusr',function(req,res){
    res.render('forgot _userid.pug');
})
app.all('/login_frgtpass',function(req,res){
    res.render('forgot_psw_verify.pug');
})
app.all('/forgot_userid_otp',function(req,res){

    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("KSBA");
        dbo.collection("customers").find({$and:[{RegMob:"+91"+req.body.mno},{'PAN.Number':req.body.pan}]}).toArray(function(err, result) {
          if (err) throw err;
             if((result.length>0)&&(result[0].DOB[0].Date==req.body.dob))      
             {
            req.session.mno="+91"+req.body.mno;
            req.session.pan=req.body.pan;
             req.session.sid=result[0]._id
             req.session.email=result[0].Mail
             res.render('forgot_userid_otp.pug',{Mobile:req.body.mno});
                 }
             else
             {
                 res.render('login.pug',{msg:"User Doesn't Exist!"});
                }
                db.close();
        });
      });
})
app.all('/forgot_userid_otp_correct',function(req,res){
    if(req.session.sid)
    {
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'arjun1997.130@gmail.com',
              pass: 'Birthdaycoming@0211'
            }
          });
          
          var mailOptions = {
            from: 'arjun1997.130@gmail.com',
            to: req.session.email,
            subject: 'KSBA Bank',
            text: 'Your Customer ID:'+req.session.sid
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        
            res.render('forgot_userid_success.pug');
    
        }
        else{
           
            res.render("/login",{msg:""});
        }
        req.session.destroy(function(err){
            if(err)
            {
                res.negotiate(err);
            }
        })  
})
app.all('/forgot_psw_cardform',function(req,res){
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("KSBA");
        req.session.cid=parseFloat(req.body.cid);
        console.log(req.body.year+" "+req.body.month);
        var ob1={_id:parseFloat(req.body.cid)};
        dbo.collection("customers").find(ob1).toArray(function(err, result) {
          if (err) throw err;
          console.log(b);
          if((result[0].Account[3].Credit_card[0].Card_No==req.body.card)&&(req.body.cvv==result[0].Account[3].Credit_card[2].CVV)&&(result.length>0))
          {
              var b=parseFloat(result[0].RegMob);
              res.render('forgot_passwd_otp.pug',{Mobile:b});
          }
          else{
             res.render('login.pug',{msg:"Credentials Incorrect!"})
          }
          db.close();
             
        });
      });
})
app.all('/forgot_passwd_otp_correct',function(req,res){
    res.render('forgot_pass_reset.pug');
})
app.all('/forgot_passwd_success',function(req,response){
    if(req.session.cid)
    {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("KSBA");
        var myquery = { _id: req.session.cid };
        dbo.collection("customers").find(myquery).toArray(function(err, result) {
            if (err) throw err;
            var ol1=result[0].password[0].old1;
            var ol2=result[0].password[1].old2;
            var cu=result[0].password[2].cur;
            if(req.body.psw==cu||req.body.psw==ol1||req.body.psw==ol2)
            {
                response.render('forgot_pass_reset.pug')
            }
            else{
                var newvalues = { $set: {password:[{old1:ol2},{old2:cu},{cur:req.body.psw}]}};
                dbo.collection("customers").updateOne(myquery, newvalues, function(err, res) {
                  response.render('login.pug',{msg:""});
                });
            }
            db.close();
               
          });
        
      });
    }
    else{
        response.render('login.pug',{msg:""});
    }

})
app.all('/login_otp_correct',function(req,res){
    if(req.session.cid)
    {
        res.render('Accounts.pug',{name:req.session.name});
    }
    else{
        req.session.destroy(function(err){
            if(err)
            {
                res.negotiate(err);
            }
        res.render('login.pug')
        })
    }
    
})
app.all('/view_profile',function(req,res){
    if(req.session.cid)
    {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("KSBA");
            var ob1={_id:req.session.cid};
            dbo.collection("customers").find(ob1).toArray(function(err, result) {
                var det={
                    cust:result[0]._id,
                    name:result[0].Address[1].Name[0].First_Name+" "+result[0].Address[1].Name[1].Last_Name,
                    regmob:result[0].RegMob,
                    dob:result[0].DOB[0].Date,
                    pan:result[0].PAN[0].Number,
                    adhaar:result[0].Aadhar,
                    street:result[0].Address[2].Street,
                    city:result[0].Address[3].City,
                    state:result[0].Address[4].State,
                    country:result[0].Address[6].Country,
                    pin:result[0].Address[5].Pincode,
                    email1:result[0].Mail
                }
            res.render('view_Profile.pug',det);
            db.close();    
            });
          });
    }
     else
     {req.session.destroy(function(err){
        if(err)
        {
            res.negotiate(err);
        }
    res.render('login.pug')
    })
    }
})
app.all('/view_profile_pass',function(req,res){
    if(req.session.cid)
    {
        res.render('change_password.pug',{name:req.session.name})
    }
    else{
        res.render('login.pug');
    }
})
app.all('/view_profile_changepass_submit',function(req,res){
    if(req.session.cid)
    {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("KSBA");
            var ob1={_id:req.session.cid};
            var myquery = { _id: req.session.cid };
            dbo.collection("customers").find(ob1).toArray(function(err, result) {
              if (err) throw err;
                if(req.body.psw==result[0].password[2].cur)
              {
                var ol1=result[0].password[0].old1;
                var ol2=result[0].password[1].old2;
                var cu=result[0].password[2].cur;
                var newvalues = { $set: {password:[{old1:ol2},{old2:cu},{cur:req.body.psw1}]}};
                dbo.collection("customers").updateOne(myquery, newvalues, function(err, resul) {
                    res.render('Accounts.pug',{name:req.session.name});
                  });
              }
              else
              {
                res.render('change_password.pug',{name:req.session.name})
              }
              db.close();
                 
            });
          });
    }
    else{
        res.render('login.pug');
    }
})
app.all('/view_profile_addr',function(req,res){
    if(req.session.cid)
    {
        res.render('Change_Address.pug',{name:req.session.name});
    }
    else{
        res.render('login.pug')
    }
})
app.all('/view_profile_addr_submit',function(req,res){
    if(req.session.cid)
    {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("KSBA");
            var ob1={_id:req.session.cid};
            var myquery = { _id: req.session.cid };
            dbo.collection("customers").find(ob1).toArray(function(err, result) {
              if (err) throw err;
                if(req.body.psw==result[0].password[2].cur)
              {
                var street=req.body.add2;
                var city=req.body.city;
                var state=req.body.state;
                var pincode=req.body.zip;
                var kyc=req.body.pic;
                var newvalues = { $set: {Address:[{Street:street},{City:city},{State:state},{Pincode:pincode},{KYC:[ {File:kyc} ] } ] }};
                dbo.collection("customers").updateOne(myquery, newvalues, function(err, resut) {
                    res.render('Accounts.pug',{name:req.session.name});
                  });
              }
              else
              {
                res.render('Change_Address.pug',{name:req.session.name})
              }
              db.close();
                 
            });
          });
    }
    else{
        res.render('login.pug');
    }

})
app.all('/view_profile_pan',function(req,res){
    if(req.session.cid)
    {
        res.render('Update_PAN.pug',{name:req.session.name});

    }
    else{
    res.render('login.pug')
    }
})
app.all('/view_profile_pan_submit',function(req,res){
    if(req.session.cid)
    {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("KSBA");
            var ob1={_id:req.session.cid};
            dbo.collection("customers").find(ob1).toArray(function(err, result) {
              if (err) throw err;
                if((req.body.psw==result[0].password[2].cur)&&(req.body.cpan==result[0].PAN[0].Number))
              {
                var pan=req.body.npan;
                var kyc=req.body.pic;
                var newvalues = { $set: {PAN:[{Number:pan},{KYC:kyc}]}};
                dbo.collection("customers").updateOne(ob1, newvalues, function(err, resut) {
                    res.render('Accounts.pug',{name:req.session.name});
                  });
              }
              else
              {
                res.render('Update_PAN.pug',{name:req.session.name})
              }
              db.close();
                 
            });
          });
    }
    else{
        res.render('login.pug');
    }
})
app.all('/view_profile_mail',function(req,res){
    if(req.session.cid)
    {
        res.render('Update_Mail_and_Mobile.pug',{name:req.session.name,cid:req.session.cid,email:req.session.email});

    }
    else{
    res.render('login.pug')
    }
})
app.all('/view_profile_mail_submit',function(req,res){
    if(req.session.cid)
    {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("KSBA");
            var ob1={_id:req.session.cid};
            dbo.collection("customers").find(ob1).toArray(function(err, result) {
              if (err) throw err;
                if((req.body.psw==result[0].password[2].cur)&&(req.body.mno==result[0].RegMob))
              {
                var mailid=req.body.mailid1;
                var mno=req.body.mno1;
                var newvalues = { $set: {PAN:[{Number:pan},{KYC:kyc}]}};
                dbo.collection("customers").updateOne(ob1, newvalues, function(err, resut) {
                    res.render('Accounts.pug',{name:req.session.name});
                  });
              }
              else
              {
                res.render('Update_Mail_and_Mobile.pug',{name:req.session.name})
              }
              db.close();
                 
            });
          });
    }
    else{
        res.render('login.pug');
    }
})
app.all('/alerts',function(req,res){
    if(req.session.cid)
    {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("KSBA");
            var ob1={_id:req.session.cid};
            dbo.collection("customers").find(ob1).toArray(function(err, result) {
            alerts=result[0].Alert;
            res.render('Alerts.pug',alerts);
            db.close();    
            });
          });
    }
     else
     {
         req.session.destroy(function(err){
        if(err)
        {
            res.negotiate(err);
        }
    res.render('login.pug')
    })
    }
})
app.all('/msg*',function(req,res){
    if(req.session.cid)
    {
        var a=req.params[0]
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("KSBA");
            var ob1={_id:req.session.cid};
            var k=1
            dbo.collection("customers").find(ob1).toArray(function(err, result) {
            alerts=result[0].Alert;
            for(i=0;i<alerts.length;i++)
            {
                if(alerts[i].Message[0].id==a)
                {
                    console.log(alerts[i]);
                    res.render("view_Message.pug",alerts[i]);
                    k=0;
                }
            }
            if(k==1)
            {
                res.render('Accounts.pug',{name:req.session.name});
            }
            db.close();    
            });
          });
    }
    else{
        req.session.destroy(function(err){
            if(err)
            {
                res.negotiate(err);
            }
        res.render('login.pug')
        })
    }
})
app.all('/logout',function(req,res){
    req.session.destroy(function(err){
        if(err)
        {
            res.negotiate(err);
        }
    })
    res.render('homePage.pug');
})
app.listen(1337)