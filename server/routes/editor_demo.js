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
          publicKey: 'jhbfavaxy778ap8nka5ndjq01c',
          model: 'nexus5',
          os_version: '6.0',
          orientation: 'portrait',
          params: {
            'boop.server': (host.protocol === 'https' ? 'wss' : 'ws') + '://' + host.address + '/api/device?id=' + device_id,
            'boop.scripts': JSON.stringify([
              host.protocol + '://' + host.address + '/device/android.js'
            ])
          }
        },
        server: host.address,
        autosave: false,
        app: {
          icon: '/favicon.ico'
        },
        code: {
          name: 'Sign in, send message',
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
