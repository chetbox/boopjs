exports.add_routes = function(app) {

  var fs = require('fs');
  var shortid = require('shortid');
  var host = require('config').get('host');

  var devices = require.main.require('./model/devices');

  var demo_code = fs.readFileSync(__dirname + '/../demos/slack.js');

  app.get('/demo', function(req, res) {
    devices.create_device({user: null})
    .then(function(device_id) {
      res.render('edit', {
        device: {
          id: device_id,
          model: 'nexus5',
          orientation: 'portrait',
        },
        server: host.address,
        server_url: (host.protocol === 'https' ? 'wss' : 'ws') + '://' + host.address + '/api/device?id=' + device_id,
        api_url: host.protocol + '://' + host.address + '/device/android.js',
        app: {
          icon: '/favicon.ico',
          publicKey: '5v1d0qrmwy74yhq5w33zc12ar0'
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
