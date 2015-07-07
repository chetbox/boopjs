exports.add_routes = function(app) {

  app.get('/', function(req, res) {
    res.render('landing-page');
  });

};
