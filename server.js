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
        let game = games.get(roomCode);
        if (game.players.length == game.numPlayers){
            io.in('Room:' + roomCode).emit('startGame', (game)); 
            // need to emit to the first dealer that it is their turn
            sendTurn(game.players[0], game);
        }
        else{
            socket.emit('notEnoughPlayers')
        }
    });

    // asdfasdfdasfasdf

    // what if all players fold?



    // this is the one
    socket.on('playTurn', (data) => { // data contains actionState and bet
        let user = sockets.get(socket);
        let roomCode = user.room;
        let game = games.get(roomCode);
        
        /*
        // this line is flawed
        let currentPlayer = game.nextTurn();
        // blinds
        if (game.turn == 1 && game.round == 0) {
            game.pot += (game.callAmount * 1.5);
            currentPlayer.call(game.callAmount / 2);
            currentPlayer = game.nextTurn();
            currentPlayer.call(game.callAmount);
        }
        */

        let currentPlayer = game.players[game.turnIndex];
        console.log(currentPlayer.username + " played " + data.actionState);

        currentPlayer.actionState = data.actionState;

        if (data.actionState == 'fold') {
            // do nothing
        }

        if (data.actionState == 'call') {
            currentPlayer.call(game.callAmount);
            game.pot += game.callAmount;
        }

        if (data.actionState == 'raise') {
            currentPlayer.call(data.bet);
            game.pot += data.bet;
            game.callAmount = data.bet;
            game.betIndex = (game.betIndex + game.turn) % game.numPlayers;
            game.turn = 0;
        }
        
        do {
            currentPlayer = game.nextTurn(); // we are looking at the next player
            if (game.turn >= game.numPlayers) { // indicates that the round has played all players
                game.nextRound();
            }
            if (game.round >= 4) { // indicates that the game has played all four rounds
                // store money to award to the winner
                game.nextDealer(); // handles making all players' action states 'null'
                currentPlayer = game.players[game.turnIndex];
            }
        // keep looping until the current player is not folded or until the current hand is over
        } while (currentPlayer.actionState == 'fold');

        // emit update to all players
        io.in('Room:' + roomCode).emit('updateTable', (game));
        
        // emit turn to specific player that is next
        sendTurn(currentPlayer, game);

    });

    // this is probably messed up in some way, will fix
    socket.on('dddds', (data) => { // this can emit to the next player's turn and make everyone else's disappear
        // TO-DO: make the game work
        let user = sockets.get(socket);
        let roomCode = user.room;
        let game = games.get(roomCode);
        let turn = game.turn; // game turn use modulo to figure out whose turn it is, skip or not
        let index = turn % game.players.length;
        let currentPlayer = game.players[index];
        if (currentPlayer.username == user.username) { // matching usernames, for now; good player
            // this player can go
            currentPlayer.actionState = data.actionState;
            if (data.actionState == "call") {
                // remove current bet amount
                currentPlayer.balance -= game.callAmount;
                game.pot += callAmount;
            }
            if (data.actionState == "raise") {
                currentPlayer.balance -= data.bet;
                game.pot += data.bet;
                game.callAmount = data.bet;
            }
            game.turn++;

            socket.emit('playTurn', {currentPlayer: currentPlayer, index: index, pot: game.pot, callAmount: game.callAmount});
        }
    });
});

function sendTurn(player, game) {
    for (const sock of sockets.keys()) {
        if (sockets.get(sock).username == player.username) {
            sock.emit('yourTurn', {callAmount: game.callAmount, balance: player.balance});
            console.log('it is ' + player.username + '\'s turn');
            break;
        }
    }
}

class Player {
    constructor(username, balance) {
        this.username = username;
        this.balance = balance;
        this.actionState = null;
        this.bet = null;
    }

    call(amount) {
        this.balance -= amount;
    }

    bet() {
        this.balance -= this.bet;
        return this.bet;
    }
}

class Game {
    constructor(numPlayers, startingAmount, ante) {
        this.numPlayers = numPlayers;
        this.players = [];
        this.startingAmount = startingAmount;
        this.ante = ante;

        // fields for a "hand":
        this.dealerIndex = 0;
        this.round = 0; // pre-flop, the flop, the turn, the river
        this.pot = 0;
 
        // fields for a "round":
        this.betIndex = 0; // tracks location of highest bet
        this.turn = 0; // starts with little blind
        this.callAmount = ante; // this tracks the current betting round's minimum to "check"
    }
    
    get turnIndex() {
        return (this.dealerIndex + this.betIndex + this.turn) % this.numPlayers;       
    }

    nextTurn() {
        this.turn++;
        return this.players[this.turnIndex];
    }

    nextRound() {
        this.betIndex = 0;
        this.turn = 0;
        this.callAmount = this.ante;
        this.round++;
        for (const player of this.players) {
            if (player.actionState != 'fold') {
                player.actionState = null;
            }
        }
    }

    nextDealer() {
        this.dealerIndex = (this.dealerIndex + 1) % this.numPlayers;
        this.round = 0;
        this.pot = 0;
        for (const player of this.players) {
            player.actionState = null;
        }
    }
}

server.listen(port, () => {
    console.log('listening on *:' + port);
});
