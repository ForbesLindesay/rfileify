var load = require('rfile');
var loadHTML = require('rhtml');
var loadSRC = require('ruglify');

console.log(load('./robot.html'));
console.log(load('./robot', {extensions: ['.html']}));

console.warn(loadHTML('./complex.html'));

console.dir(Function('return ' + loadSRC('./answer.js'))());
