let socket = io();

const menuScreen = document.querySelector('.menu-screen');
let hostButton = document.getElementById('hostButton');
let joinButton = document.getElementById('joinButton');

const hostScreen = document.querySelector('.host-screen');
let hostSubmitButton = document.getElementById('hostSubmitButton');

const joinScreen = document.querySelector('.join-screen');
let joinSubmitButton = document.getElementById('joinSubmitButton');

const waitingScreen = document.querySelector('.waiting-screen');
let startButton = document.getElementById('startButton');

const tableScreen = document.querySelector('.table-screen');
let playTurn = document.getElementById('playTurn');

var slider = document.getElementById("betSlider");
var sliderLabel = document.getElementById("demo");
sliderLabel.innerHTML = slider.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
    sliderLabel.innerHTML = this.value;
}

let screens = [menuScreen, hostScreen, joinScreen, waitingScreen, tableScreen];
let seats = [];

let dealer = false;
let tempPot = 0;

function init() {
    presentScreen(menuScreen);
}

hostButton.addEventListener('click', () => {
    presentScreen(hostScreen);

});

joinButton.addEventListener('click', () => {
    presentScreen(joinScreen);
});

hostSubmitButton.addEventListener('click', () => {
    let username = document.getElementById('hostUsername').value;
    let numPlayers = Number.parseInt(document.getElementById('numPlayers').value);
    let startingAmount = Number.parseInt(document.getElementById('startingAmount').value);
    let ante = Number.parseInt(document.getElementById('ante').value);
    var errorString = '';
    if (username == '') {
        errorString += 'Please enter a player name.<br/>';
    }
    if (numPlayers < 3 || numPlayers > 5) {
        errorString += 'The number of players should be between 3 and 5.<br/>';
    }
    if (isNaN(startingAmount) || startingAmount < 0) {
        errorString += 'The starting amount should be more than $0.<br/>';
    }
    if (isNaN(ante) || ante < 0) {
        errorString += 'The ante should be more than $0.<br/>';
    } else if (ante > startingAmount) {
        errorString += 'The ante should be a value less than the starting amount.<br/>';
    }

    if (errorString) {
        document.getElementById('hostError').innerHTML = errorString;
    } else {
        socket.emit('hostGame', {username: username, numPlayers: numPlayers, startingAmount: startingAmount, ante: ante});
    }
});

socket.on('hostGame', (data) => {
    document.getElementById('joinCodeNumber').innerHTML = data.joinCode;
    presentScreen(waitingScreen);
});

joinSubmitButton.addEventListener('click', () => {
    let username = document.getElementById('joinUsername').value;
    let joinCode = document.getElementById('joinCode').value;
    if (username == '') {
        document.getElementById('joinError').innerHTML = "Please enter a player name.";
    }else{
        socket.emit('joinGame', {username: username, joinCode: joinCode});
    }
});

socket.on('joinGame', (joinCode) => {
    if (joinCode == -1){
        document.getElementById('joinError').innerHTML= "Invalid code entered.";
    }
    else if (joinCode == -2){
        document.getElementById('joinError').innerHTML= "The room you are trying to enter is full.";
    }
    else{
        document.getElementById('joinCodeNumber').innerHTML = joinCode;
        presentScreen(waitingScreen);
    }
}); 

socket.on('playerLeft', (username) => {
    document.getElementById('waitingError').innerHTML = username + " has disconnected.";
    presentScreen(waitingScreen);
}); 

socket.on('newPlayerJoined', (data) => {
    document.getElementById('joinedNumber').innerHTML = data.players.length + "/" + data.numPlayers +" players are in this room:";
    let usernameList = "";
    for (let player in data.players){
        usernameList += data.players[player].username + "<br>";
    }
    console.log(data.players);
    document.getElementById('joinedPlayers').innerHTML = usernameList;
});

startButton.addEventListener('click', () => {
    socket.emit('startGame')
});

socket.on('notEnoughPlayers', ()=>{
    document.getElementById('waitingError').innerHTML = 'There is not enough people in the room to start.';
});

socket.on('startGame', (game) => {
    let player1 = document.getElementById('player1');
    let player2 = document.getElementById('player2');
    let player3 = document.getElementById('player3');
    let player4 = document.getElementById('player4');
    let player5 = document.getElementById('player5');
    if (game.players.length == game.numPlayers) {
        if (game.numPlayers == 3) { // visual configuration: bottom player, top left, top right
            seats.push(player1, player3, player4);
            player2.style.display = 'none';
            player5.style.display = 'none';
        } else if (game.numPlayers == 4) { // visual configuration: top left, top right, bottom left, bottom right
            seats.push(player2, player3, player4, player5);
            player1.style.display = 'none';
        } else if (game.numPlayers == 5) { // visual configuration: all places
            seats.push(player1, player2, player3, player4, player5);
        }
        
        for (let seat of seats) {
            addClickableSeat(seat);
        }

        makeTable(game);
        presentScreen(tableScreen);
    }
}); 


// makes table for the first time
function makeTable(gameState) {
    let players = gameState.players;
    for (let i = 0; i < players.length; i++) {
        updatePlayerSeat(players[i], i);
    }
    document.getElementById('yourTurn').style.visibility = 'hidden';
    document.getElementById('potAmount').innerHTML = "$" + gameState.pot;
    let bettingRound = '';
    switch(gameState.round) {
        case 0:
            bettingRound = 'Pre-Flop';
            break;
        case 1:
            bettingRound = 'Flop';
            break;
        case 2:
            bettingRound = 'Turn';
            break;
        case 3:
            bettingRound = 'River';
            break;
    }
    document.getElementById('bettingRound').innerHTML = bettingRound;
    document.getElementById('callAmount').innerHTML = "Wager: $" + gameState.callAmount;
    // remove later
    document.getElementById('miscInfo').innerHTML = "It is currently " + players[(gameState.dealerIndex + gameState.betIndex + gameState.turn + 1) % gameState.numPlayers].username + "\'s turn.</br>The dealer for this hand is " + players[gameState.dealerIndex].username + ".";
    //document.getElementById('miscInfo').innerHTML = "Round: " + gameState.round + "</br>Dealer Index: " + gameState.dealerIndex + "</br>Turn: " + gameState.turn + "</br>callAmount: " + gameState.callAmount + "</br>betIndex: " + gameState.betIndex;
}

function updatePlayerSeat(player, index) {
    let seat = seats[index];
    seat.querySelector('.nameLabel').innerHTML = player.username;
    seat.querySelector('.balanceLabel').innerHTML = "$" + player.balance;
    let actionStateLabel = seat.querySelector('.actionStateLabel');
    actionStateLabel.innerHTML = player.actionState;
    if (player.actionState == 'big blind') {
        actionStateLabel.style.color = '#D4AF37';
    } else if (player.actionState == 'small blind') {
        actionStateLabel.style.color = '#03DBFC';
    }
}

socket.on('updateTable', (game) => {
    makeTable(game);
});

socket.on('yourTurn', (data) => {
    document.getElementById('callAmount2').innerHTML = "($" + (data.callAmount - data.wager) + " more)";
    slider.min = data.callAmount;
    slider.max = data.balance;
    slider.value = data.callAmount;
    fadeIn(document.getElementById('yourTurn'));
    console.log('your turn!');
});

socket.on('chooseWinner', (data) => {
    tempPot = data.pot;
});

playTurn.addEventListener('click', () => {
    let actionState = document.querySelector('input[name="turn"]:checked').value;
    let bet = Number.parseInt(document.getElementById('betSlider').value);
    document.getElementById('callAmount2').innerHTML = "(You " + actionState.substring(0, 4) + "ed.)";
    document.getElementById('yourTurn').style.visibility = 'hidden';
    socket.emit('playTurn', {actionState: actionState, bet: bet});
});

function addClickableSeat(element) {
    element.addEventListener('click', () => {
        if (tempPot != null) {
            for (let i = 0; i < seats.length; i++) {
                if (seats[i] == element) {
                    socket.emit('winner', {index: i, pot: tempPot});
                    tempPot = null;
                    break;
                }
            }
        }
    });
}

function presentScreen(screen) {
    for (let i = 0; i < screens.length; i++) {
        const other = screens[i];
        if (other != screen) {
            fadeOut(other);
        }
    }
    fadeIn(screen)
}

function fadeIn(element) {
    var op = 0.1;  // initial opacity
    element.style.display = 'block';
    var timer = setInterval(function () {
        if (op >= 1){
            clearInterval(timer);
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op += op * 0.1;
    }, 10);
    element.style.visibility = 'visible';
}


function fadeOut(element) {
    var op = 1;  // initial opacity
    var timer = setInterval(function () {
        if (op <= 0.1){
            clearInterval(timer);
            element.style.display = 'none';
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.1;
    }, 10);
}

