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
        let game = new Game(data.numPlayers, data.startingAmount, data.ante);
        games.set(joinCode, game);
        sockets.set(socket, {username: data.username, room: joinCode});
        // Adds player to the games player list
        game.players.push(new Player(data.username, data.startingAmount));
        // To implement feature ensuring different numbers 
        socket.emit('hostGame', {joinCode: joinCode});
        io.in('Room:' + joinCode).emit('newPlayerJoined', {players: game.players, numPlayers: data.numPlayers});
    });
  
    socket.on('joinGame', (data) => {
        //real invalid code check to be implemented
        if (games.has(data.joinCode)) {
            socket.join('Room:' + data.joinCode)
            sockets.set(socket, {username: data.username, room:data.joinCode});
            let game = games.get(data.joinCode)
            game.players.push(new Player(data.username, game.startingAmount));
            socket.emit('joinGame', data.joinCode);
            io.in('Room:' + data.joinCode).emit('newPlayerJoined', {players: game.players, numPlayers: game.numPlayers});
        } else {
            socket.emit('joinGame', -1);
        }
    });
  
    socket.on('startGame', () => {
        // TO-DO: ensure all players are connected, and numPlayers matches players map
        let user = sockets.get(socket);
        let roomCode = user.room;
        io.in('Room:' + roomCode).emit('startGame', (games.get(roomCode))); 
    });   
});

class Player {
    constructor(username, balance) {
        this.username = username;
        this.balance = balance;
        this.actionState = null;
        this.bet = null;
    }
}

class Game {
    constructor(numPlayers, startingAmount, ante) {
        this.numPlayers = numPlayers;
        this.players = [];
        this.startingAmount = startingAmount;
        this.ante = ante;
    }
}
server.listen(port, () => {
    console.log('listening on *:' + port);
});
