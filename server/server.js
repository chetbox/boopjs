// Set random seed
require('shortid').seed(56873);

var express = require('express');
var app = express();
var express_handlebars = require('express-handlebars');
var moment = require('moment');
var body_parser = require('body-parser');

var db = require('./db');
var index = require('./index');
var editor_demo = require('./editor_demo');
var editor = require('./editor');
var email = require('./reporting/email');

// Settings

var port = process.env.PORT || 8001;


// Database

db.setup();

// Mustache setup

var hbs = express_handlebars.create({
    defaultLayout: false,
    extname: '.html',
    layoutsDir: __dirname + '/html',
    partialsDir: __dirname + '/html/partials',
    helpers: {
      date_relative: function(d) {
        if (d === undefined) {
          return '?';
        }
        return moment(d).fromNow();
      }
    },
});

app.engine('html', hbs.engine);
app.set('view engine', 'html');
app.set('views', __dirname + '/html');


// HTTP body parsing

app.use(body_parser.text());
app.use(body_parser.urlencoded());


// Application setup

app.use(express.static(__dirname + '/public'));
require('./auth')             .setup(app, {logged_in_homepage: '/apps'});
require('./index')            .add_routes(app);
require('./editor_demo')      .add_routes(app);
require('./editor')           .add_routes(app);
require('./websocket_server') .add_routes(app);
require('./admin')            .add_routes(app);


// Errors: print to console & email

app.use(function(err, req, res, next) {
  console.error(err.stack || err);
  res.status(500).send(err.message || err.toString());
  email.send_to_admins(email.message.error(req.url, req.user, err));
});

// Launch

app.listen(port, function() {
    console.log((new Date()) + ' Server is listening on port ' + port + ' with configuration: ' + process.env.NODE_ENV);
});
