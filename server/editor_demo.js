exports.add_routes = function(app) {

  var fs = require('fs');
  var shortid = require('shortid');

  var devices = require('./devices');

  var demo_code = fs.readFileSync(__dirname + '/demos/stopwatch.js');

  app.get('/demo', function(req, res) {
    devices.create_device({user: null})
    .then(function(device_id) {
      res.render('edit', {
        device: {
          id: device_id,
          model: 'nexus5',
          orientation: 'portrait',
        },
        app: {
          publicKey: 'z8460qxgdyrfe8c2ag1z6bqyw0'
        },
        autosave: false,
        code: {
          content: demo_code
        }
      });
    })
    .catch(function(e) {
      console.error(e.stack || e);
      res.status(500).send(e.toString());
    });
  });

};
