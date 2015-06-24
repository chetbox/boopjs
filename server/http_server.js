var express = require('express');
var app = express();
var mu2Express = require("mu2Express");
var uuid = require('uuid');


// Mustache setup

app.engine('html', mu2Express.engine);
app.set('view engine', 'html');
app.set('views', __dirname + '/html');


// Routes

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.send('beep boop beep');
});

app.get('/demo', function(req, res) {
  res.render('demo.html', {
    locals: {
      session: {
        id: uuid.v4()
      }
    }
  });
});


exports.app = app;
