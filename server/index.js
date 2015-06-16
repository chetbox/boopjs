var app = require('./http_server').app;
var websocket = require('./websocket_server');

var port = process.env.PORT || 8001;

websocket.add_routes(app);

app.listen(port, function() {
    console.log((new Date()) + ' Server is listening on port ' + port);
});
