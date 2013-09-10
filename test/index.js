var browserify = require('browserify');

var vm = require('vm');
var fs = require('fs');
var path = require('path');
var assert = require('assert');

var html = fs.readFileSync(__dirname + '/files/robot.html', 'utf8').replace(/\r/g, '');

describe('rfile(path)', function () {
  it('inlines the text for declarations', function (done) {
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
  })
  it('allows inlining to be turned off', function (done) {
    var remaining = 6;

    var expectedRequires = [
      './robot.html',
      './robot.html',
      './answer.js'
    ];

    var b = browserify();
    var rfileify = require(path.dirname(__dirname));
    b.add(__dirname + '/files/sample.js');
    b.transform(rfileify({inline: false}));

    b.bundle(function (err, src) {
      if (err) throw err;

      // Verify correct execution.
      vm.runInNewContext(src, { console: { log: log, dir: dir } });

      // Verify that each module was required, not inlined.
      var patched = src.replace(/\brequire\(/g, 'req(');
      vm.runInNewContext(patched, { console: { log: noop, dir: noop}, req: req });

    });

    function noop () {}
    function log (msg) {
      assert.equal(msg, html);
      if (0 === --remaining) done();
    }
    function dir (msg) {
      assert.equal(msg, '42');
      if (0 === --remaining) done();
    }
    function req (name) {
      assert.equal(name, expectedRequires.shift());
      if (0 === --remaining) done();
    }
  })
});