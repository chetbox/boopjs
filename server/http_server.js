var fs = require('fs');
var express = require('express');
var app = express();
var mu2express = require('mu2express');
var uuid = require('uuid');

var auth = require('./auth');


// Mustache setup

app.engine('html', mu2express.engine);
app.set('view engine', 'html');
app.set('views', __dirname + '/html');


// Auth setup

auth.setup(app);


// Routes

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.send('beep boop beep');
});

app.get('/demo',
  auth.login_required,
  function(req, res) {
    res.render('demo', {
      locals: {
        session: {
          id: uuid.v4()
        },
        demo: {
          stopwatch: function() {
            return fs.readFileSync(__dirname + '/demos/stopwatch.js');
          }
        }
      }
    });
  }
);

exports.app = app;
