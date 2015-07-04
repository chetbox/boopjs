var passport = require('passport');
var expressSession = require('express-session');
var GitHubStrategy = require('passport-github2').Strategy;
var config = require('config');
var _ = require('underscore');

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
    var serializable_user = _.extend(
      _.pick(user, 'id', 'username', 'displayName', 'profileUrl', 'provider'),
      {
        avatarUrl: user._json.avatar_url,
        emails: user.emails.map(function(i) { return i.value; })
      }
    );

    db.users().insert(serializable_user)
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
  res.redirect('/auth/github');
}

function setup(app) {
  app.use(expressSession({secret: 'f7417279-09ce-4ee9-9476-cd7d49668137'}));
  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/account',
    login_required,
    function(req, res) {
      res.render('account', { locals: req.user });
    }
  );

  app.get('/login', function(req, res) {
    res.render('login');
  });

  app.get('/auth/github',
    passport.authenticate('github', { scope: [ 'user:email' ] }),
    function(req, res) {
      // The request will be redirected to GitHub for authentication, so this
      // function will not be called.
    }
  );

  app.get('/auth/github/callback',
    passport.authenticate('github', {failureRedirect: '/login'}),
    function(req, res) {
      // TODO: redirect to correct URL after sign in
      res.redirect('/demo');
    }
  );

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

}

exports.setup = setup;
exports.login_required = login_required;
