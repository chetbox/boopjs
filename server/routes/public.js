exports.add_routes = function(app) {

  app.get('/', function(req, res) {
    res.render('landing-page', {
      user: req.user
    });
  });

  app.get('/docs', function(req, res) {
    res.redirect('/docs/BOOP.JS API reference v0.7.3.pdf');
  });

  app.get('/pricing', function(req, res) {
    res.render('pricing', {
      user: req.user,
      tiers: [
        {
          name: 'Free',
          monthly_cost: '£0/mo',
          app_limit: 1,
          test_limit: 5,
          current: !!req.user
        },
        {
          name: 'Indie',
          monthly_cost: '£150/mo',
          app_limit: 2,
          test_limit: null,
          support: 'Email support'
        },
        {
          name: 'Team',
          monthly_cost: '£350/mo',
          app_limit: 10,
          test_limit: null,
          support: 'Telephone + email support'
        },
        {
          name: 'Unlimited',
          monthly_cost: 'Contact us',
          app_limit: null,
          test_limit: null,
          support: 'Telephone + email support'
        }
      ]
    });
  });

};
