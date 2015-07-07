exports.add_routes = function(app) {

  var textBody = require('body');
  var uuid = require('uuid');

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

  function fail_on_error(res) {
    return function(e) {
      console.error(e.stack);
      res.status(500).send(e.toString());
    }
  }

  app.post('/edit',
    auth.login_required,
    // TODO: check that user is allowed to create another test for this app
    function(req, res) {
      var new_test_id = uuid.v4();
      db.code()
      .insert({
        id: new_test_id,
        platform: 'android',
        content: '// Write your test here\n\n'
        // TODO: add user to 'can_edit' list
        // TODO: add app(etize?) identifier
      })
      .then(function() {
        res.redirect('/edit/' + new_test_id);
      })
      .catch(fail_on_error(res));
    }
  );

  app.get('/edit/:id',
    auth.login_required,
    // TODO: check that user can access this test
    function(req, res) {
      db.code()
      .find(req.params.id)
      .then(function(code) {
        if (!code) {
          return res.sendStatus(404);
        }
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
      .catch(fail_on_error(res));
    }
  );

  app.get('/edit/:id/code',
    auth.login_required, // TODO: return forbidden if no access
    function(req, res) {
      db.code()
      .find(req.params.id)
      .then(function(code) {
        if (!code) {
          return res.sendStatus(404);
        }
        res.set('Content-Type', 'text/javascript');
        res.status(200).send(code.content);
      })
      .catch(fail_on_error(res));
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
      .catch(fail_on_error(res));
    }
  );

};
