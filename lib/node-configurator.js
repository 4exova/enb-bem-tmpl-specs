var path = require('path'),
    fs = require('fs'),

    levels = require('enb-bem/techs/levels'),
    files = require('enb-bem/techs/files'),

    provide = require('enb/techs/file-provider'),
    bemdeckFromDepsByTech = require('enb-bem/techs/bemdecl-from-deps-by-tech'),
    deps = require('enb-bem/techs/deps-old'),
    bemdeclToDeps = require('./techs/bemdecl-to-deps'),
    mergeBemdecl = require('enb-bem/techs/merge-bemdecl'),

    references = require('./techs/references'),
    spec = require('./techs/tmpl-spec');

exports.configure = function (config, options) {
    var pattern = path.join(options.destPath, '*'),
        sourceLevels = [].concat(options.sourceLevels);

    config.nodes(pattern, function (nodeConfig) {
        var nodePath = nodeConfig.getNodePath(),
            sublevel = path.join(nodePath, 'blocks'),
            engines = options.engines,
            engineTargets = [];

        if (fs.existsSync(sublevel)) {
            sourceLevels.push(sublevel);
        }

        // Base techs
        nodeConfig.addTechs([
            [levels, { levels: sourceLevels }],
            [provide, { target: '?.base.bemdecl.js' }],
            [bemdeckFromDepsByTech, {
                target: '?.tech.bemdecl.js',
                filesTarget: '?.base.files',
                sourceTech: 'tmpl-spec.js', destTech: 'bemhtml'
            }],
            [mergeBemdecl, { bemdeclSources: ['?.base.bemdecl.js', '?.tech.bemdecl.js'] }],
            [bemdeclToDeps, { source: '?.base.bemdecl.js', target: '?.base.deps.js' }],
            [deps],
            [files, {
                depsTarget: '?.base.deps.js',
                filesTarget: '?.base.files',
                dirsTarget: '?.base.dirs'
            }],
            [files]
        ]);

        engines.forEach(function (engine) {
            nodeConfig.addTech([engine.tech, engine.options]);
            nodeConfig.addTarget(engine.target);
            engineTargets.push(engine.target);
        });

        nodeConfig.addTechs([
            [references, { dirsTarget: '?.base.dirs' }],
            [spec, { engines: engines, engineTargets: engineTargets, saveHtml: options.saveHtml }]
        ]);

        nodeConfig.addTarget('?.tmpl-spec.js');
    });
};
