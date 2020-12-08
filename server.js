// Everything server-side goes in here

const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const port = 3000
let app = express();
let server = http.createServer(app);

app.use(express.static("public"));

let io = socketIO(server);

let games = new Map();
let sockets = new Map();
io.on('connection', (socket) => {

    socket.on('hostGame', (data) => {
      //Generate random number from 0000 - 9999
      var joinCode = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
      socket.join('Room:' + joinCode)
      games.set(joinCode, new Game(data.numPlayers,data.startingAmount, data.smallBlind));
      sockets.set(socket, {username: data.username, room:joinCode});
      //Adds player to the games player list
      games.get(joinCode).players.set(data.username, new Player(data.startingAmount));
      // To implement feature ensuring different numbers 
      io.emit('hostGame', joinCode);
    });

    socket.on('joinGame', (joinCode) =>{
      //real invalid code check to be implemented
      if (games.has(joinCode)){
        io.emit('joinGame', joinCode);
      } 
      else {
        io.emit('joinGame', -1);
      }
    });
});

class Player {
  constructor(balance) {
      this.balance = balance;
      this.actionState = null;
      this.bet = null;
  }
}

class Game {
  constructor( numPlayers, startingAmount, blind) {
      this.numPlayers = numPlayers;
      this.players = new Map();
      this.startingBalance = startingAmount;
      this.blind = blind;
  }
}
server.listen(port, () => {
  console.log('listening on *:' + port);
});
