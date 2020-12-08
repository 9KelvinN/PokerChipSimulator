// Everything server-side goes in here

var express = require('express');
var app = express();
var http = require('http').createServer(app);

app.use(express.static("public"));

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });

var io = require('socket.io')(http);

io.on('connection', (socket) => {
  console.log('a user connected');
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});