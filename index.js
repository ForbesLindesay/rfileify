var path = require('path');

var through = require('through');
var falafel = require('falafel');

var rfileModules = ['rfile', 'rhtml', 'ruglify'];
var deadCode = 'undefined /* removed rfile require */';

module.exports = function (file) {
    if (/\.json$/.test(file)) return through();

    var data = '';
    var rfileNames = {};
    var dirname = path.dirname(file);
    var varNames = ['__filename', '__dirname', 'path', 'join'];
    var vars = [file, dirname, path, path.join];
    
    return through(write, end);
    
    function write (buf) { data += buf }
    function end () {
        var tr = this;
        var parsed = false;
        try {
            var output = falafel(data, function (node) {
                if (requireName(node) && rfileModules.indexOf(requireName(node)) != -1 && rfileVariableName(node.parent)) {
                    rfileNames['key:' + rfileVariableName(node.parent)] = requireName(node);
                    node.update(deadCode);
                }
                if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && rfileNames['key:' + node.callee.name]) {
                    var rfile = require(rfileNames['key:' + node.callee.name]);
                    var args = node.arguments;
                    for (var i = 0; i < args.length; i++) {
                        var t = 'return ' + (args[i]).source();
                        args[i] = Function(varNames, t).apply(null, vars);
                    }
                    args[1] = args[1] || {};
                    args[1].basedir = args[1].basedir || dirname;
                    node.update(JSON.stringify(rfile.apply(null, args)));
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
