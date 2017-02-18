var express = require('express');
// var auth = require('./auth.js');
// var smoothie = require('../public/elements/views/smoothie.js')
var path = require('path');
var router = express.Router();
var app = express();

router.use(function(req,res,next){
  // console.log('check for token valid? ' +auth.hasValidSession(req) );
  // if (auth.hasValidSession(req)) {
      next();
  // } else {
  //   next(res.sendStatus(403).send('Forbidden'));
  // }
});

/* GET Secure resource */
router.get('/', function(req, res, next) {
  //console.log('Accessing the secure section ...'+path.join(__dirname + '/secure.html'))
  // res.sendFile(path.join(__dirname + '/../public/secure.html'));
  console.log('test for secure-page-routes');
});

/* GET Secure resource for data */
router.get('/datas', function(req, res, next) {
  console.log('secure-page-routes: test for getting connectedDeviceConfig')
  res.json(req.app.get('connectedDeviceConfig'));
});

module.exports = router;
