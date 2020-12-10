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
            let game = games.get(data.joinCode)
            if (game.players.length == game.numPlayers){
                socket.emit('joinGame', -2);
            } else {
                socket.join('Room:' + data.joinCode)
                sockets.set(socket, {username: data.username, room:data.joinCode});
                game.players.push(new Player(data.username, game.startingAmount));
                socket.emit('joinGame', data.joinCode);
                io.in('Room:' + data.joinCode).emit('newPlayerJoined', {players: game.players, numPlayers: game.numPlayers});
            }
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
            game.blinds();
            io.in('Room:' + roomCode).emit('startGame', (game)); 
            // need to emit to the first dealer that it is their turn
            
            let currentPlayer = game.players[game.turnIndex];
            sendTurn(game.players[3 % game.numPlayers], game);
        }
        else{
            socket.emit('notEnoughPlayers');
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
            game.pot += currentPlayer.deduct(game.callAmount);
        }

        if (data.actionState == 'raise') {
            game.pot += currentPlayer.deduct(game.callAmount + data.bet);
            game.callAmount = game.callAmount + data.bet;
            game.betIndex = (game.betIndex + game.turn) % game.numPlayers;
            game.turn = 0;
        }
        
        do {
            currentPlayer = game.nextTurn(); // we are looking at the next player
            if (game.turn >= game.numPlayers) { // indicates that the round has played all players
                game.nextRound();
                currentPlayer = game.players[(game.dealerIndex + 1) % game.numPlayers];
            }
            if (game.round >= 4) { // indicates that the game has played all four rounds
                // store money to award to the winner
                sendChooseWinner(game.players[game.dealerIndex], game.pot);
                game.nextDealer(); // handles making all players' action states 'null'
                // handle blinds
                game.blinds();
                currentPlayer = game.players[game.turnIndex];
            }
        // keep looping until the current player is not folded or until the current hand is over
        } while (currentPlayer.actionState == 'fold');

        // emit update to all players
        io.in('Room:' + roomCode).emit('updateTable', (game));
        
        // emit turn to specific player that is next
        sendTurn(currentPlayer, game);

    });

    socket.on('winner', (data) => {
        let user = sockets.get(socket);
        let game = games.get(user.room);
        game.players[data.index].balance += data.pot;
    });

    socket.on('disconnecting', () => {
        if(sockets.has(socket)){
            let user = sockets.get(socket);
            let game = games.get(user.room);
            for( var i = 0; i < game.players.length; i++){ 
                if ( game.players[i].username == user.username) {  
                    game.players.splice(i, 1); 
                }
            }
            sockets.delete(socket);
            if(game.players.length == 0){
                games.delete(user.room);
            }
            else{
                io.in('Room:' + user.room).emit('newPlayerJoined', {players: game.players, numPlayers: game.numPlayers});
            }
        }
    });  
});

function sendTurn(player, game) {
    for (const sock of sockets.keys()) {
        if (sockets.get(sock).username == player.username) {
            sock.emit('yourTurn', {callAmount: game.callAmount, pot: game.pot, balance: player.balance, wager: player.wager});
            console.log('it is ' + player.username + '\'s turn');
            break;
        }
    }
}

function sendChooseWinner(dealer, pot) {
    for (const sock of sockets.keys()) {
        if (sockets.get(sock).username == dealer.username) {
            sock.emit('chooseWinner', {pot: pot});
            break;
        }
    }
}

class Player {
    constructor(username, balance) {
        this.username = username;
        this.balance = balance;
        this.actionState = '';
        this.wager = 0;
    }

    deduct(amount) {
        let difference = amount - this.wager;
        this.balance -= difference;
        this.wager = amount;
        return difference;
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
        this.callAmount = 0; // this tracks the current betting round's minimum to "check"
    }
    
    get turnIndex() {
        return (this.dealerIndex + this.betIndex + this.turn + 1) % this.numPlayers;       
    }

    nextTurn() {
        this.turn++;
        return this.players[this.turnIndex];
    }

    nextRound() {
        this.betIndex = 0;
        this.turn = 0;
        this.callAmount = 0;
        this.round++;
        for (const player of this.players) {
            if (player.actionState != 'fold') {
                player.actionState = '';
                player.wager = 0;
            }
        }
    }

    nextDealer() {
        this.dealerIndex = (this.dealerIndex + 1) % this.numPlayers;
        this.round = 0;
        this.pot = 0;
        for (const player of this.players) {
            player.actionState = '';
        }
    }

    blinds() {
        this.players[this.dealerIndex].actionState = 'dealer';
        let smallBlind = this.players[(this.dealerIndex + 1) % this.numPlayers];
        this.pot += smallBlind.deduct(this.ante / 2);
        smallBlind.actionState = 'small blind';
        let bigBlind = this.players[(this.dealerIndex + 2) % this.numPlayers];
        this.pot += bigBlind.deduct(this.ante);
        bigBlind.actionState = 'big blind';
        this.callAmount = this.ante;
        this.betIndex = 2 % this.numPlayers;
        this.turn = 0;
    }
}

server.listen(port, () => {
    console.log('listening on *:' + port);
});
