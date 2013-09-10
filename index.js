var path = require('path');

var rfile = require('rfile');
var through = require('through');
var falafel = require('falafel');

var rfileModules = ['rfile', 'ruglify'];
var deadCode = 'undefined /* removed rfile require */';
var defaultTransformer = new InlineTransformer();

module.exports = function rfileify(file) {

    // When rfileify is called with a non-file, treat input as configuration
    // options and create a new rfileify transformer instance.
    if (file && typeof file !== 'string') {
        var transformer = createTransformer(file);
        return function rfileify() {
            return module.exports.apply(transformer, arguments);
        }
    }

    // JSON files will not contain calls to rfile.
    if (/\.json$/.test(file)) return through();

    var data = '';
    var rfileNames = {};
    var dirname = path.dirname(file);
    var varNames = ['__filename', '__dirname', 'path', 'join'];
    var vars = [file, dirname, path, path.join];
    var transformer = this === global ? defaultTransformer : this;

    return through(write, end);

    function write (buf) { data += buf }
    function end () {

        var tr = this;
        var parsed = false;

        try {
            var output = falafel(transformer.preprocess(file) || data, function (node) {
                if (requireName(node) && rfileModules.indexOf(requireName(node)) != -1 && rfileVariableName(node.parent)) {
                    rfileNames['key:' + rfileVariableName(node.parent)] = requireName(node);
                    node.update(deadCode);
                }
                if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && rfileNames['key:' + node.callee.name]) {
                    var rmodule = require(rfileNames['key:' + node.callee.name]);
                    var args = node.arguments;
                    for (var i = 0; i < args.length; i++) {
                        var t = 'return ' + (args[i]).source();
                        args[i] = Function(varNames, t).apply(null, vars);
                    }
                    args[1] = args[1] || {};
                    args[1].basedir = args[1].basedir || dirname;
                    node.update(transformer.transform(rmodule, args, dirname));
                }
            });
        } catch (ex) {
            if (parsed) return tr.emit('error', ex), tr.queue(data), tr.queue(null);
            else return tr.queue(data), tr.queue(null);
        }
        tr.queue(String(output));
        tr.queue(null);
    }
};

function requireName(node) {
    var c = node.callee;
    if (c && node.type === 'CallExpression' && c.type === 'Identifier' && c.name === 'require') {
        return node.arguments[0].value;
    }
}
function variableDeclarationName(node) {
    if (node && node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
        return node.id.name;
    }
}
function variableAssignmentName(node) {
    if (node && node.type === 'AssignmentExpression' && node.operator === '=' &&
        node.left.type === 'Identifier') {
        return node.left.name;
    }
}
function rfileVariableName(node) {
    return variableDeclarationName(node) || variableAssignmentName(node);
}
function createTransformer(options) {
    if (options.inline === false) {
        return new ModuleTransformer();
    } else {
        return new InlineTransformer();
    }
}

// Default transformer replaces rfile() calls with inline file contents.
function InlineTransformer() {}
InlineTransformer.prototype.preprocess = function() {}
InlineTransformer.prototype.transform = function(rmodule, args, dirname) {
    return JSON.stringify(rmodule.apply(null, args));
}

// Non-inline transformer replaces rfile() calls with require() calls, and
// transforms those files to modules that export their contents as strings.
function ModuleTransformer() {
    this.entries = {};
}
ModuleTransformer.prototype.preprocess = function(file) {
    var fullpath = path.resolve(file);
    if (this.entries.hasOwnProperty(fullpath)) {
        var entry = this.entries[fullpath];
        var contents = entry.rmodule.apply(null, entry.args);
        return 'module.exports = ' + JSON.stringify(contents);
    }
}
ModuleTransformer.prototype.transform = function(rmodule, args, dirname) {
    var resolve = rmodule.resolve || rfile.resolve;
    var fullpath = path.join(args[1].basedir, args[0]);
    var relpath = path.relative(dirname, resolve.apply(null, args));
    this.entries[fullpath] = {
        args: args,
        rmodule: rmodule
    };
    return 'require(' + JSON.stringify('./' + relpath) + ')';
}