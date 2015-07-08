exports.add_routes = function(app) {

  var textBody = require('body');
  var shortid = require('shortid');
  var _ = require('underscore');

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

  // TODO: cache DB lookup
  function ensure_code_belongs_to_app(req, res, next) {
    db.code().find({hash: req.params.code_id, range: req.params.app_id})
    .then(function(code) {
      if (!code) {
        throw new Error('Code not found');
      }
      next();
    })
    .catch(fail_on_error(res));
  }

  function ensure_user_can_access_app(req, res, next) {
    if (!req.user.apps || req.user.apps.indexOf(req.params.app_id) === -1) {
      res.status(403).send('You don\'t have access to this app');
    } else {
      next();
    }
  }

  app.post('/app',
    auth.login_required,
    // TODO: check that user is allowed to create another app
    function(req, res) {
      // TODO: upload user's app
      var new_app_id = shortid.generate();
      var new_code_id = shortid.generate();
      Promise.all([
        db.apps().insert({
          id: new_app_id,
          platform: 'android',
          code_id: new_code_id, // TODO: fix gross hack because we can't search 'code' table by range key (app_id)
          publicKey: 'z8460qxgdyrfe8c2ag1z6bqyw0', // TODO: replace stopwatch app with uploaded
          privateKey: 'private_j9p0rykhzf2tw998t9ndcz0r9r' // TODO: replace stopwatch app with uploaded
        }),
        db.code().insert({
          id: new_code_id,
          app_id: new_app_id,
          content: '// Write your test here\n\n'
        })
      ])
      .then(function() {
        req.user.apps = _.union(req.user.apps, [new_app_id]);
        return db.users().update(req.user);
      })
      .then(function() {
        res.redirect('/app/' + new_app_id + '/edit/' + new_code_id);
      })
      .catch(fail_on_error(res));
    }
  );

  // Temporarily just redirect the only code associated with this app
  // TODO: app.get('/app/:id') -> list of tests for app
  app.get('/app/:app_id',
    auth.login_required,
    ensure_user_can_access_app,
    function(req, res) {
      db.apps().find(req.params.app_id)
      .then(function(app) {
        if (app) {
          res.redirect('/app/' + req.params.app_id + '/edit/' + app.code_id);
        } else {
          throw new Error('App/code not found');
        }
      })
      .catch(fail_on_error(res));
    }
  );

  app.get('/app/:app_id/edit/:code_id',
    auth.login_required,
    ensure_user_can_access_app,
    ensure_code_belongs_to_app,
    function(req, res) {
      db.code()
      .find({hash: req.params.code_id, range: req.params.app_id})
      .then(function(code) {
        if (!code) {
          return res.sendStatus(404);
        }
        res.render('edit', {
          device: {
            id: shortid.generate(),
            model: 'nexus5',
            orientation: 'portrait'
          },
          autosave: true,
          code: code.content
        });
      })
      .catch(fail_on_error(res));
    }
  );

  app.get('/app/:app_id/edit/:code_id/code',
    auth.login_required, // TODO: return forbidden if no access
    ensure_user_can_access_app,
    ensure_code_belongs_to_app,
    function(req, res) {
      db.code()
      .find(req.params.code_id)
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

  app.put('/app/:app_id/edit/:code_id/code',
    auth.login_required, // TODO: return forbidden if no access
    ensure_user_can_access_app,
    ensure_code_belongs_to_app,
    extract_text_body,
    function(req, res) {
      db.code().update({
        id: req.params.code_id,
        content: req.body || null
      })
      .then(function() {
        res.sendStatus(200);
      })
      .catch(fail_on_error(res));
    }
  );

};
