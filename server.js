// Everything server-side goes in here

const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const port = 3000
let app = express();
let server = http.createServer(app);

app.use(express.static("public"));

let io = socketIO(server);

let games = [];
io.on('connection', (socket) => {

    socket.on('hostGame', () => {
      //Generate random number from 0000 - 9999
      var joinCode = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
      console.log(joinCode);
      // To implement feature ensuring different numbers 
      io.emit('hostGame', joinCode);
    });
});



server.listen(port, () => {
  console.log('listening on *:' + port);
});