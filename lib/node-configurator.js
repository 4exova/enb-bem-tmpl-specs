var path = require('path');
var fs = require('fs');

var levels = require('enb/techs/levels');
var files = require('enb/techs/files');

var bemdeclFromDepsByTech = require('enb/techs/bemdecl-from-deps-by-tech');
var bemdeckByKeeps = require('./techs/bemdecl-by-keeps');
var depsByKeeps = require('./techs/deps-by-keeps');
var deps = require('enb/techs/deps-old');

var bemhtml = require('enb-bemxjst/techs/bemhtml-old');
var bh = require('enb-bh/techs/bh-server');
var clientBH = require('enb-bh/techs/bh-client');

var references = require('./techs/references.js');
var js = require('enb/techs/js');

var borschik = require('enb-borschik/techs/borschik');

exports.configure = function (config, options) {
    var pattern = path.join(options.destPath, '*');
    var sourceLevels = [].concat(options.sourceLevels);

    config.nodes(pattern, function (nodeConfig) {
        var root = config.getRootPath();
        var nodePath = nodeConfig.getNodePath();
        var sublevel = path.join(nodePath, 'blocks');

        if (fs.existsSync(sublevel)) {
            sourceLevels.push(sublevel);
        }

        // Base techs
        nodeConfig.addTechs([
            [levels, { levels: sourceLevels }],
            [bemdeckByKeeps, { target: '?.bemdecl.js' }],
            [depsByKeeps, { target: '?.base.deps.js' }],
            [deps]
        ]);

        // Files
        nodeConfig.addTechs([
            [files, {
                depsTarget: '?.base.deps.js',
                filesTarget: '?.base.files',
                dirsTarget: '?.base.dirs'
            }],
            [files]
        ]);

        // BEMHTML
        nodeConfig.addTechs([
            [bemhtml, {
                target: '?.prod.bemhtml.js',
                devMode: false
            }],
            [bemhtml, {
                target: '?.dev.bemhtml.js',
                devMode: true
            }]
        ]);

        var bhFilename = path.join(__dirname, '..', 'node_modules', 'bh', 'lib', 'bh.js');

        // BH
        nodeConfig.addTechs([
            [bh, { jsAttrName: 'data-bem', jsAttrScheme: 'json' }],
            [clientBH, {
                target: '?.bh.browser.js',
                bhFile: path.relative(root, bhFilename),
                jsAttrName: 'data-bem',
                jsAttrScheme: 'json'
            }]
        ]);

        // Client BEMHTML
        nodeConfig.addTechs([
            [bemdeclFromDepsByTech, {
                target: '?.bemhtml.bemdecl.js',
                sourceTech: 'tmpl-spec.js',
                destTech: 'bemhtml'
            }],
            [deps, {
                depsTarget: '?.bemhtml.deps.js',
                bemdeclTarget: '?.bemhtml.bemdecl.js'
            }],
            [files, {
                depsTarget: '?.bemhtml.deps.js',
                filesTarget: '?.bemhtml.files',
                dirsTarget: '?.bemhtml.dirs'
            }],
            [bemhtml, {
                target: '?.prod.bemhtml.browser.js',
                filesTarget: '?.bemhtml.files',
                devMode: false
            }],
            [bemhtml, {
                target: '?.dev.bemhtml.browser.js',
                filesTarget: '?.bemhtml.files',
                devMode: true
            }]
        ]);

        nodeConfig.addTechs([
            [js, {
                target: '?.pure.tmpl-spec.js',
                sourceSuffixes: ['tmpl-spec.js'],
                filesTarget: '?.base.files'
            }],
            [references]
        ]);

        nodeConfig.mode('development', function () {
            nodeConfig.addTechs([
                [borschik, {
                    source: '?.tmpl-spec.js',
                    target: '?.tmpl-spec.min.js',
                    freeze: true,
                    minify: false
                }]
            ]);
        });

        nodeConfig.mode('production', function () {
            nodeConfig.addTechs([
                [borschik, {
                    source: '?.tmpl-spec.js',
                    target: '?.tmpl-spec.min.js',
                    freeze: true,
                    minify: true
                }]
            ]);
        });

        nodeConfig.addTargets([
            '?.dev.bemhtml.browser.js', '?.prod.bemhtml.browser.js',
            '?.dev.bemhtml.js', '?.prod.bemhtml.js',
            '?.bh.js', '?.bh.browser.js',
            '?.pure.tmpl-spec.js', '?.references.js'
        ]);
    });
};
