var browserify = require('browserify');

var vm = require('vm');
var fs = require('fs');
var path = require('path');
var assert = require('assert');

var html = fs.readFileSync(__dirname + '/files/robot.html', 'utf8').replace(/\r/g, '');
var minHtml = fs.readFileSync(__dirname + '/files/complex.min.html', 'utf8').replace(/\r/g, '');

describe('rfile(path)', function () {
  it('inlines the text for declarations', function (done) {
    var remaining = 3;

    var b = browserify();
    b.add(__dirname + '/files/sample.js');
    b.transform(path.dirname(__dirname));

    b.bundle(function (err, src) {
      if (err) throw err;
      vm.runInNewContext(src, { console: { log: log, warn: warn, dir: dir } });
    });

    function log (msg) {
      assert.equal(msg, html);
      if (0 === --remaining) done();
    }
    function warn (msg) {
      assert.equal(msg, minHtml);
      if (0 === --remaining) done();
    }
    function dir (msg) {
      assert.equal(msg, '42');
      if (0 === --remaining) done();
    }
  });

  it('inlines the text for assignments', function (done) {
    var remaining = 3;

    var b = browserify();
    b.add(__dirname + '/files/sample-assignment.js');
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
  });
});
