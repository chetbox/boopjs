exports.add_routes = function(app) {

  var fs = require('fs');
  var uuid = require('uuid');

  app.get('/demo', function(req, res) {
    res.render('edit', { locals: {
      device: {
        id: uuid.v4(),
        model: 'nexus5',
        orientation: 'portrait'
      },
      autosave: false,
      code: function() {
        // TODO: memoize
        return fs.readFileSync(__dirname + '/demos/stopwatch.js');
      }
    }});
  });

};
