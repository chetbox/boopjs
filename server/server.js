var express = require('express');
var app = express();
var mu2express = require('mu2express');

var index = require('./index');
var editor_demo = require('./editor_demo');
var editor = require('./editor');


// Settings

var port = process.env.PORT || 8001;


// Mustache setup

app.engine('html', mu2express.engine);
app.set('view engine', 'html');
app.set('views', __dirname + '/html');


// Application setup

app.use(express.static(__dirname + '/public'));
require('./auth')             .setup(app);
require('./index')            .add_routes(app);
require('./editor_demo')      .add_routes(app);
require('./editor')           .add_routes(app);
require('./websocket_server') .add_routes(app);


// Launch

app.listen(port, function() {
    console.log((new Date()) + ' Server is listening on port ' + port);
});
