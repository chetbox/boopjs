exports.add_routes = function(app) {

  var fs = require('fs');
  var shortid = require('shortid');

  app.get('/demo', function(req, res) {
    res.render('edit', {
      device: {
        id: shortid.generate(),
        model: 'nexus5',
        orientation: 'portrait',
      },
      app: {
        publicKey: 'z8460qxgdyrfe8c2ag1z6bqyw0'
      },
      autosave: false,
      code: function() {
        // TODO: memoize
        return fs.readFileSync(__dirname + '/demos/stopwatch.js');
      }
    });
  });

};
