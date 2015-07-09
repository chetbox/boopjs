var passport = require('passport');
var expressSession = require('express-session');
var GitHubStrategy = require('passport-github2').Strategy;
var config = require('config');
var _ = require('underscore');
var flash = require('connect-flash');

var db = require('./db');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(user_id, done) {
  db.users().find(user_id)
    .then(function(user) { done(null, user); })
    .catch(done);
});

passport.use(new GitHubStrategy(
  config.get('github-oauth'),
  function(accessToken, refreshToken, user, done) {
    console.log('User authenticated: ' + user.username);
    // TODO: generate internal user ID for session serialisation
    var serializable_user = _.extend(
      _.pick(user, 'id', 'username', 'displayName', 'profileUrl', 'provider'),
      {
        avatarUrl: user._json.avatar_url,
        emails: user.emails.map(function(i) { return i.value; })
      }
    );

    // TODO: fix grossness ('apps' stored as part of user object)
    db.users()
    .find(user.id)
    .then(function(db_user) {
      return db.users().insert( _.extend(db_user || {}, serializable_user) );
    })
    .then(function() {
      done(null, serializable_user);
    })
    .catch(done);
  }
));

function login_required(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/github?redirect=' + encodeURIComponent(req.url));
}

function setup(app) {
  app.use(expressSession({secret: 'f7417279-09ce-4ee9-9476-cd7d49668137'}));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());

  app.get('/home',
    login_required,
    function(req, res) {
      res.render('auth/home', req.user);
    }
  );

  app.get('/apps',
    login_required,
    function(req, res) {
      res.render('auth/apps', req.user);
    }
  );

  app.get('/login', function(req, res) {
    res.render('login', {layout: false});
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
      res.redirect(_.last(req.flash('redirect')) || '/demo');
    }
  );

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

}

exports.setup = setup;
exports.login_required = login_required;
