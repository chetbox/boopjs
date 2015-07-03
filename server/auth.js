var passport = require('passport');
var expressSession = require('express-session');
var GitHubStrategy = require('passport-github2').Strategy;
var config = require('config');

passport.serializeUser(function(user, done) {
  // TODO: send req.user.id instead of req.user
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  // TODO: get user object from id (not user) passed as first arg
  done(null, user);
});

passport.use(new GitHubStrategy(
  config.get('github-oauth'),
  function(accessToken, refreshToken, profile, done) {
    // TODO: persist user
    // User.findOrCreate({ github_id: profile.id }, function (err, user) {
    //  return done(err, user);
    // });
    return done(null, profile);
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

  // TODO: implement login page
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
