var browserify = require('browserify');

var vm = require('vm');
var fs = require('fs');
var path = require('path');
var assert = require('assert');

var html = fs.readFileSync(__dirname + '/files/robot.html', 'utf8');

describe('rfile(path)', function () {
  it('inlines the text', function (done) {
    var remaining = 3;

    var b = browserify();
    b.add(__dirname + '/files/sample.js');
    b.transform(path.dirname(__dirname));

    b.bundle(function (err, src) {
      if (err) throw err;
      vm.runInNewContext(src, { console: { log: log, dir: dir } });
    });

    function log (msg) {
      assert.equal(msg, html);
      if (0 === --remaining) done();
    }
    function dir (msg) {
      assert.equal(msg, '42');
      if (0 === --remaining) done();
    }
  })
});