var fs = require('fs');
var express = require('express');
var app = express();
var mu2express = require('mu2express');
var uuid = require('uuid');
var textBody = require('body');

var db = require('./db');
var auth = require('./auth');


function extract_text_body(req, res, next) {
  textBody(req, function(err, body) {
    if (err) {
      res.status(500).send('Expected text HTTP body');
    } else {
      req.body = body;
      next();
    }
  });
}


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

app.get('/demo', function(req, res) {
  res.render('edit', { locals: {
    device: {
      id: uuid.v4(),
      model: 'nexus5',
      orientation: 'portrait'
    },
    autosave: false,
    code: function() {
      // TODO: memoize
      return fs.readFileSync(__dirname + '/demos/stopwatch.js');
    }
  }});
});

app.get('/edit/:id',
  auth.login_required,
  // TODO: check that text exists
  // TODO: check that user can access this test
  function(req, res) {
    db.code().find(req.params.id)
    .then(function(code) {
      res.render('edit', { locals: {
        device: {
          id: uuid.v4(),
          model: 'nexus5',
          orientation: 'portrait'
        },
        autosave: true,
        code: code.content
      }});
    })
    .catch(function(e) {
      console.error(e.stack);
      res.status(500).send(e.toString());
    });
  }
);

app.get('/edit/:id/code',
  auth.login_required, // TODO: return forbidden if no access
  function(req, res) {
    db.code().find(req.params.id)
    .then(function(code) {
      if (code) {
        res.set('Content-Type', 'text/javascript');
        res.status(200).send(code.content);
      } else {
        res.sendStatus(404);
      }
    })
    .catch(function(e) {
      console.error(e.stack);
      res.status(500).send(e.toString());
    })
  }
);

app.put('/edit/:id/code',
  auth.login_required, // TODO: return forbidden if no access
  // TODO: check that user can access this test
  extract_text_body,
  function(req, res) {
    db.code().update({
      id: req.params.id,
      content: req.body || null
    })
    .then(function() {
      res.sendStatus(200);
    })
    .catch(function(e) {
      console.error(e.stack);
      res.status(500).send(e.toString());
    });
  }
);

exports.app = app;
