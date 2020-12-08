// Everything server-side goes in here

var express = require('express');
var app = express();
var http = require('http').createServer(app);

app.use(express.static("public"));

class Player {
  constructor(name, balance, state, bet) {
      this.name = name;
      this.balance = balance;
      this.state = state;
      this.bet = bet;
  }
}

class Game {
  constructor(roomCode, players, startingBalance, blind) {
      this.roomCode = roomCode;
      this.players = players;
      this.startingBalance = startingBalance;
      this.blind = blind;
  }
}

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });

//var io = require('socket.io')(http);
const io = require('socket.io-client');

io.on('connection', (socket) => {
  console.log('a user connected');
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});