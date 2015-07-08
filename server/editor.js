exports.add_routes = function(app) {

  var shortid = require('shortid');
  var _ = require('underscore');
  var AWS = require('aws-sdk');
  var config = require('config');

  var db = require('./db');
  var auth = require('./auth');

  AWS.config.update(config.get('s3'));

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

  app.get('/sign_s3',
    auth.login_required,
    function(req, res) {
      var s3 = new AWS.S3();
      var S3_BUCKET = 'chetbot.apps.us-standard';
      var file_path = req.user.id + '/' + shortid.generate() + '.apk';
      var s3_params = {
        Bucket: S3_BUCKET,
        Key: file_path,
        Expires: 60,
        ContentType: req.query.file_type,
        ACL: 'public-read'
      };
      s3.getSignedUrl('putObject', s3_params, function(err, data) {
        if (err) {
          console.error(err);
        } else {
          var return_data = {
            signed_request: data,
            url: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + file_path
          };
          res.write(JSON.stringify(return_data));
          res.end();
        }
      });
    }
  );

  app.post('/app',
    auth.login_required,
    // TODO: check that user is allowed to create another app
    function(req, res) {
      // TODO: upload user's app
      console.log('TODO: upload to appetize.io', req.body);
      var new_app_id = shortid.generate();
      var new_code_id = shortid.generate();
      Promise.all([
        db.apps().insert({
          id: new_app_id,
          platform: 'android',
          code_id: new_code_id, // TODO: fix gross hack because we can't search 'code' table by range key (app_id)
          app_url: req.body.app_url,
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
    function(req, res) {
      db.code().update({
        id: req.params.code_id,
        app_id: req.params.app_id,
        content: req.body || null
      })
      .then(function() {
        res.sendStatus(200);
      })
      .catch(fail_on_error(res));
    }
  );

};
