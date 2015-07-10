exports.add_routes = function(app) {

  var fs = require('fs');
  var shortid = require('shortid');

  app.get('/demo', function(req, res) {
    res.render('edit', {
      device: {
        id: shortid.generate(),
        model: 'nexus5',
        orientation: 'portrait'
      },
      layout: false,
      autosave: false,
      code: function() {
        // TODO: memoize
        return fs.readFileSync(__dirname + '/demos/stopwatch.js');
      }
    });
  });

};
