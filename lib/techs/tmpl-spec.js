var fs = require('fs');
var path = require('path');
var asset = fs.readFileSync(path.join(__dirname,'..', 'assets', 'tmpl-spec'));
var _ = require('lodash');
var htmlDifferFilename = path.join(__dirname, '..', '..', 'node_modules', 'html-differ');

module.exports = require('enb/lib/build-flow').create()
    .name('tmpl-spec')
    .target('target', '?.tmpl-spec.js')
    .defineRequiredOption('engines')
    .defineOption('saveHtml', false)
    .useSourceFilename('references', '?.references.js')
    .useSourceListFilenames('engineTargets', [])
    .builder(function (referencesFilename) {
        var node = this.node;
        var nodeDirname = node.getDir();
        var describe = path.basename(node.getDir()) + '\u001b[' + 94 + 'm' + ' (' +
            path.dirname(node.getPath()) + ')' + '\u001b[0m';
        var references = require(referencesFilename);
        var engines = this._engines.map(function (engine) {
            var target = node.unmaskTargetName(engine.target);
            var filename = ['.', target].join(path.sep);

            return {
                name: engine.name,
                varname: engine.name.replace(/\W/gi, '_'),
                path: filename,
                filename: path.join(nodeDirname, target),
                exportName: engine.exportName && '.' + engine.exportName
            };
        });
        var its = [];

        Object.keys(references).forEach(function (name) {
            var bemjson = references[name].bemjson;
            var html = references[name].html;

            bemjson && html && its.push(name);
        });

        return _.template(asset, {
            describe: describe,
            htmlDifferFilename: ['.', path.relative(nodeDirname, htmlDifferFilename)].join(path.sep),
            referencesFilename: ['.', path.relative(nodeDirname, referencesFilename)].join(path.sep),
            its: its,
            engines: engines,
            saveHtml: this._saveHtml
        });
    })
    .createTech();
