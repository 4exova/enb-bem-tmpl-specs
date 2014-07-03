var path = require('path');
var builder = require('./builder');
var configurator = require('./node-configurator');
var runner = require('./runner');

module.exports = function (maker) {
    return {
        build: function (options) {
            options || (options = {});
            options.sourceLevels || (options.sourceLevels = options.levels);
            options.fileSuffixes || (options.fileSuffixes = ['tmpl-spec.js']);
            options.bundleSuffixes || (options.bundleSuffixes = ['tmpl-specs']);

            var resolve = builder({ suffixes: [].concat(options.fileSuffixes, options.bundleSuffixes) });
            var config = maker._config;
            var cdir = config._rootPath;
            var buildDeferred = maker._buildDeferred;
            var deferred = maker._deferred;

            configurator.configure(config, options);

            maker._pseudoLevels.push({
                destPath: options.destPath,
                levels: options.levels,
                resolve: resolve
            });

            return buildDeferred.promise()
                .then(function (targets) {
                    return runner.run(targets.map(function (target) {
                        var basename = path.basename(target);

                        return path.join(cdir, target, basename + '.tmpl-spec.js');
                    }));
                })
                .then(function (res) {
                    deferred.resolve(res);
                })
                .fail(function () {
                    deferred.reject(new Error('Fail template specs'));
                });
        }
    };
};
