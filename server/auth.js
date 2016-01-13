var passport = require('passport');
var expressSession = require('express-session');
var GitHubStrategy = require('passport-github2').Strategy;
var config = require('config');
var _ = require('underscore');
var flash = require('connect-flash');

var db = require('./db');
var email = require('./reporting/email');

var DEBUG_AS_USER = process.env.DEBUG_AS_USER;

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(user_id, done) {
  db.users().find(user_id)
    .then(function(user) { done(null, user); })
    .catch(done);
});

passport.use(new GitHubStrategy(
  _.extend(
    config.get('github-oauth'),
    {
      callbackURL: config.get('host.protocol') + '://' + config.get('host.address') + '/auth/github/callback'
    }
  ),
  function(accessToken, refreshToken, user, done) {
    console.log('User authenticated: ' + user.username);
    // TODO: generate internal user ID for session serialisation
    var new_db_user = _.extend(
      _.pick(user, function(val, key) {
        return val && _.contains(['id', 'username', 'displayName', 'profileUrl', 'provider'], key)
      }),
      {
        avatarUrl: user._json.avatar_url,
        emails: user.emails.map(function(i) { return i.value; }),
        last_signed_in: new Date().getTime()
      }
    );

    // Make Chet an admin
    if (new_db_user.username == 'chetbox') {
      new_db_user.admin = 1;
    }

    // TODO: fix grossness ('apps' stored as part of user object)
    db.users()
    .find(user.id)
    .then(function(db_user) {
      if (!db_user) {
        email.send_to_admins(email.message.new_user(new_db_user));
      }
      return db_user;
    })
    .then(function(db_user) {
      return db.users().insert( _.extend(db_user || {}, new_db_user) );
    })
    .then(function() {
      done(null, new_db_user);
    })
    .catch(done);
  }
));

function login_required(req, res, next) {
  if (DEBUG_AS_USER) {
    console.warn('WARNING: Skipping authentication in debugging mode:', DEBUG_AS_USER);
    db.users().find(DEBUG_AS_USER)
    .then(function(user) {
      if (!user) throw new Error('User not found: ' + DEBUG_AS_USER);
      req.user = user;
      req.isAuthenticated = function() {
        return true;
      }
      next();
    })
    .catch(next);
    return;
  }

  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/github?redirect=' + encodeURIComponent(req.url));
}

function ensure_user_is_admin(req, res, next) {
  if (req.user && req.user.admin) {
    next();
  } else {
    res.sendStatus(403);
  }
}

function ensure_logged_in_user(key) {
  return function(req, res, next) {
    if (req.user && (req.user.id === req.params[key] || req.user.admin)) {
      next();
    } else {
      res.sendStatus(403);
    }
  }
}

function setup(app, options) {

  var options = options || {};

  function login_redirect(req) {
    return _.last(req.flash('redirect')) || options.logged_in_homepage || '/';
  }

  function logout_redirect(req) {
    return options.logged_out_homepage || '/';
  }

  app.use(expressSession({
    secret: 'f7417279-09ce-4ee9-9476-cd7d49668137',
    resave: false
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());

  app.get('/account/:user_id',
    login_required,
    ensure_logged_in_user('user_id'),
    function(req, res, next) {
      db.users().find(req.params.user_id)
      .then(function(user) {
        res.render('account', {
          user: req.user,
          requested_user: user
        });
      })
      .catch(next);
    }
  );

  app.get('/login', function(req, res) {
    if (req.isAuthenticated()) {
      res.redirect(login_redirect(req));
    } else {
      res.render('login');
    }
  });

  app.get('/auth/github',
    function(req, res, next) {
      req.flash('redirect', req.query.redirect);
      next();
    },
    passport.authenticate('github', {scope: ['user:email']})
  );

  app.get('/auth/github/callback',
    passport.authenticate('github', {failureRedirect: '/login'}),
    function (req, res) {
      res.redirect(login_redirect(req));
    }
  );

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect(logout_redirect(req));
  });

}

exports.setup = setup;
exports.login_required = login_required;
exports.ensure_user_is_admin = ensure_user_is_admin;
