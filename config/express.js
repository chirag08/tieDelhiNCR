var express    = require('express'),
  bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser')

module.exports = function (app) {
  // Configure Express
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.set('view engine', 'ejs');
  app.use(cookieParser());
  // Setup static public directory
  app.use(express.static(__dirname + '/../public'));
  app.set('views', __dirname + '/../views');
};