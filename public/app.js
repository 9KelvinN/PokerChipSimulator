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
let player1 = document.getElementById('player1');
let player2 = document.getElementById('player2');
let player3 = document.getElementById('player3');
let player4 = document.getElementById('player4');
let player5 = document.getElementById('player5');
let raise = document.getElementById('raise');
let call = document.getElementById('call');
let fold = document.getElementById('fold');

let screens = [menuScreen, hostScreen, joinScreen, waitingScreen, tableScreen];

function init() {
    presentScreen(menuScreen);
}

hostButton.addEventListener('click', () => {
    presentScreen(hostScreen);

})

joinButton.addEventListener('click', () => {
    presentScreen(joinScreen);
})

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
})

socket.on('hostGame', (data) => {
    document.getElementById('joinCodeNumber').innerHTML = data.joinCode;
    presentScreen(waitingScreen);
});

joinSubmitButton.addEventListener('click', () => {
    let username = document.getElementById('joinUsername').value;
    let joinCode = document.getElementById('joinCode').value;
    if (username == '') {
        document.getElementById('joinError').innerHTML = "Please enter a player name.";
    }
    socket.emit('joinGame', {username: username, joinCode: joinCode});
    //nonexistant room exception to be implemented
})

socket.on('joinGame', (joinCode) => {
    if (joinCode == -1){
        //real invalid code msg to be outputted
        let errorString = document.getElementById('joinError').innerHTML;
        document.getElementById('joinError').innerHTML = "Invalid code given.";
    }
    else if (joinCode == -2){

    }
    else{
        document.getElementById('joinCodeNumber').innerHTML = joinCode;
        presentScreen(waitingScreen);
    }
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
})

socket.on('notEnoughPlayers', ()=>{
    document.getElementById('waitingError').innerHTML = 'There is not enough people in the room to start';
});

socket.on('startGame', (game) => {
    // gameState holds a Game object with 3, 4, or 5 players; starting amount, ante
    // ASSUMES that the lobby has exactly the right number of players
    let seats = null;
    if (game.numPlayers == 3) { // visual configuration: bottom player, top left, top right
        seats = [player1, player3, player4];
    } else if (game.numPlayers == 4) { // visual configuration: top left, top right, bottom left, bottom right
        seats = [player2, player3, player4, player5];
    } else if (game.numPlayers == 5) { // visual configuration: all places
        seats = [player1, player2, player3, player4, player5];
    }

    // TO-DO: assign players to seats
    for (let player in game.players) {
        
    }
    presentScreen(tableScreen);
}); 

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

