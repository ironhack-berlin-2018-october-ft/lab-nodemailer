const express = require('express');
const {ensureLoggedIn} = require('connect-ensure-login');
const User = require('../models/User');
const router  = express.Router();

/* GET home page */
router.get('/', (req, res, next) => {
  res.render('index');
});

router.get('/profile', ensureLoggedIn('/auth/login'), (req,res,next) => {
  res.render('profile', {user: req.user})
})

module.exports = router;
