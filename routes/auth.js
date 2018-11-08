const express = require("express");
const passport = require('passport');
const randomstring = require("randomstring");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const router = express.Router();

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;


router.get("/login", (req, res, next) => {
  res.render("auth/login", { "message": req.flash("error") });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/auth/login",
  failureFlash: true,
  passReqToCallback: true
}));

router.get("/signup", (req, res, next) => {
  res.render("auth/signup");
});

router.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  const confirmationCode = randomstring.generate(30)
  if (username === "" || password === "") {
    res.render("auth/signup", { message: "Indicate username and password" });
    return;
  }

  User.findOne({ username }, "username", (err, user) => {
    if (user !== null) {
      res.render("auth/signup", { message: "The username already exists" });
      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({
      username,
      password: hashPass,
      email,
      confirmationCode
    });

    newUser.save()
    .then(() => {
      let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass:  process.env.GMAIL_PASS
        }
      });

      transporter.sendMail({
        from: 'Ironhack',
        to: email, // the email entered in the form 
        subject: 'Validate your account', 
        html: `Hi ${username}, can you validate account by clicking <a href="${process.env.BASE_URL}auth/confirm/${confirmationCode}">here</a>. If the link doesn't work, you can go here: ${process.env.BASE_URL}auth/confirm/${confirmationCode}`
      })
      .then(info => console.log(info))
      .catch(error => console.log(error))

      res.redirect("/");
    })
    .catch(err => {
      console.log(err)
      res.render("auth/signup", { message: "Something went wrong" });
    })
  });
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

router.get('/confirm/:confirmationCode', (req,res,next)=> {
  let confirmationCode = req.params.confirmationCode
  // Find the first user where confirmationCode = req.params.confirmationCode
  User.findOneAndUpdate({confirmationCode}, {status: 'Active'})
  .then(user => {
    if (user) {
      // req.login makes the user login automatically
      req.login(user, () => {
        res.redirect('/profile') // Redirect to http://localhost:3000/profile
      })
    }
    else {
      next("No user found")
    }
  })
})

module.exports = router;
