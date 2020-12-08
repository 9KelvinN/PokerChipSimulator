// Everything client-side goes in here


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
    let numPlayers = document.getElementById('numPlayers').value;
    let startingAmount = document.getElementById('startingAmount').value;
    let smallBlind = document.getElementById('smallBlind').value;
    if (username == "") {
        // invalid name
    }
    if (numPlayers < 3 || numPlayers > 5) {
        // number of players must be between 3 and 5
    }
    if (startingAmount < 0) {
        // invalid starting amount
    }
    if (smallBlind > startingAmount) {
        // invalid small blind
    }
    socket.emit('hostGame');
})

socket.on('hostGame', (joinCode) => {
    document.getElementById('joinCodeNumber').innerHTML = joinCode;
    presentScreen(waitingScreen);
});

joinSubmitButton.addEventListener('click', () => {
    let username = document.getElementById('joinUsername').value;
    let joinCode = document.getElementById('joinCode').value;
    if (username == "") {
        // invalid name
    }
    socket.emit('joinGame', joinCode);
    //nonexistant room exception to be implemented
})
socket.on('joinGame', (joinCode) => {
    if (joinCode == -1){
        //real invalid code msg to be outputted
        document.getElementById('joinCode').value = "Invalid code";
    }
    else{
        document.getElementById('joinCodeNumber').innerHTML = joinCode;
        presentScreen(waitingScreen);
    }
}); 

startButton.addEventListener('click', () => {
    presentScreen(tableScreen);
})

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

