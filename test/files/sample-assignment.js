var load, loadSRC;

load = require('rfile');
loadSRC = require('ruglify');

console.log(load('./robot.html'));
console.log(load('./robot', {extensions: ['.html']}));

console.dir(Function('return ' + loadSRC('./answer.js'))());