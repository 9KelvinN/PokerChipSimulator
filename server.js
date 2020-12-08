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
      socket.emit('hostGame', joinCode);
    });

    socket.on('joinGame', (data) =>{
      //real invalid code check to be implemented
      if (games.has(data.joinCode)){
        socket.join('Room:' + data.joinCode)
        sockets.set(socket, {username: data.username, room:data.joinCode});
        game = games.get(data.joinCode)
        game.players.set(data.username, new Player(game.startingAmount));
        socket.emit('joinGame', data.joinCode);
      } 
      else {
        socket.emit('joinGame', -1);
      }
    });

    socket.on('startGame',() =>{
      user = sockets.get(socket);
      roomCode = user.room;
      io.in('Room:' + roomCode).emit('startGame', (games.get(roomCode))); 
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
      this.startingAmount = startingAmount;
      this.blind = blind;
  }
}
server.listen(port, () => {
  console.log('listening on *:' + port);
});
