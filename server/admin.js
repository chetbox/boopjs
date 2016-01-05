exports.add_routes = function(app) {

  var auth = require('./auth');
  var db = require('./db');
  var github_api = require('./github_api');

  app.get('/admin',
    auth.login_required,
    auth.ensure_user_is_admin,
    function(req, res, next) {
      db.users().scan()
      .then(function(user_ids) {
        return db.users().batchFind(user_ids.map(function(u) { return u.id; }));
      })
      .then(function(users) {
        res.render('admin', {
          user: req.user,
          all_users: users
        });
      })
      .catch(next);
    }
  );

  // Let admins manually create an account for a GitHub user
  app.post('/admin/user/:username',
    auth.login_required,
    auth.ensure_user_is_admin,
    function(req, res, next) {
      github_api.user(req.params.username)
      .then(function(gh_user) {
        return [gh_user, db.users().find(gh_user.id)];
      })
      .spread(function(gh_user, user) {
        if (user) {
          throw new Error('User "' + req.params.username + '" already exists');
        }
        return db.users().insert({
          id: gh_user.id.toString(),
          username: gh_user.login,
          displayName: gh_user.name,
          profileUrl: gh_user.html_url,
          avatarUrl: gh_user.avatar_url
        });
      })
      .then(function() {
        res.sendStatus(200);
      })
      .catch(next);
    }
  );

}
