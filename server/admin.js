exports.add_routes = function(app) {

  var auth = require('./auth');
  var db = require('./db');
  var util = require('./util');

  app.get('/admin',
    auth.login_required,
    auth.ensure_user_is_admin,
    function(req, res) {
      db.users().scan()
      .then(function(user_ids) {
        return db.users().batchFind(user_ids.map(function(u) { return u.id}));
      })
      .then(function(users) {
        res.render('admin', {
          user: req.user,
          all_users: users
        });
      })
      .catch(util.fail_on_error(res));
    }
  );

}
