// Promise debugging

require('bluebird').config({
  longStackTraces: true
});


// Coffeescript setup

require('coffee-script/register');



// Set random seed
require('shortid').seed(56873);


// Database

require('./db').v2.setup();


// Worker processes
var cluster = require('cluster');
cluster.setupMaster({ exec: 'inject-remote-apk.js' });
cluster.fork();


// Start server

require('./server').run();
