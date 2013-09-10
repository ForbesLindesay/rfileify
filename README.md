# rfileify

  Convert any code using rfile and derivatives so that it supports browserify.

[![Build Status](https://travis-ci.org/ForbesLindesay/rfileify.png?branch=master)](https://travis-ci.org/ForbesLindesay/rfileify)
[![Dependency Status](https://gemnasium.com/ForbesLindesay/rfileify.png)](https://gemnasium.com/ForbesLindesay/rfileify)

  This module is a plugin for [browserify](http://browserify.org/) to parse the AST for `rfile` calls so that you can inline the file contents into your bundles.

  In addition to supporting `rfile`, you can also use modules which internally use `rfile` providing they meet the simple requirement of taking an object with `dirname` property as their second argument and are listed in the array of valid file names modules in index.js.  Currently this is:

  - [rfile](https://github.com/ForbesLindesay/rfile) - "require" static text files
  - [ruglify](https://github.com/ForbesLindesay/ruglify) - "require" minified source code
  - [rhtml](https://github.com/yaru22/rhtml) - "require" minified HTML

Even though this module is intended for use with browserify, nothing about it is particularly specific to browserify so it should be generally useful in other projects.

## Example with Browserify

  For a main.js

```javascript
var rfile = require('rfile');
var html = rfile('./robot.html');
console.log(html);
```

  And a robot.html

```html
<b>beep boop</b>
```

  first `npm install rfileify` into your project, then:

### on the command-line

```
$ browserify -t rfileify example/main.js > bundle.js
```

now in the bundle output file,

```javascript
var html = rfile('./robot.html');
```

turns into:

```javascript
var html = "<b>beep boop</b>";
```

(and `require('rfile')` turns into `undefined` so you're not loading code you're never going to use).

### or with the API

```javascript
var browserify = require('browserify');
var fs = require('fs');

var b = browserify('example/main.js');
b.transform('rfileify');

b.bundle().pipe(fs.createWriteStream('bundle.js'));
```

## Direct Usage

A tiny command-line program ships with this module for easier debugging and if you just want this without any of the rest of browserify.

```
npm install rfileify -g
rfileify --help
```

## License

MIT

![viewcount](https://viewcount.jepso.com/count/ForbesLindesay/rfileify.png)
