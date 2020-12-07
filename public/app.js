// Everything client-side goes in here

// var socket = io();

const menuScreen = document.querySelector('.menu-screen');
const hostScreen = document.querySelector('.host-screen');
const joinScreen = document.querySelector('.join-screen');
let menuButton = document.getElementById('menuButton');
let hostButton = document.getElementById('hostButton');
let hostSubmitButton = document.getElementById('hostSubmitButton');
let joinButton = document.getElementById('joinButton');
let joinSubmitButton = document.getElementById('joinSubmitButton');

let screens = [menuScreen, hostScreen, joinScreen];

function init() {
    presentScreen(menuScreen);
}

/*
menuButton.addEventListener('click', () => {
    init();
})
*/

hostButton.addEventListener('click', () => {
    presentScreen(hostScreen);
})

joinButton.addEventListener('click', () => {
    presentScreen(joinScreen);
})

function presentScreen(element) {
    for (let i = 0; i < screens.length; i++) {
        const screen = screens[i];
        if (screen != element) {
            screen.style.display = 'none';
        }
    }
    fadeIn(element)
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

/*
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
*/
