'use strict';

const strings = require('../../resources/index');
const wrapCliCallback = require('../wrap-cli-callback');
const format = require('stringformat');
const path = require('path');

module.exports = function(dependencies) {
  const local = dependencies.local,
    logger = dependencies.logger;

  return function(opts, callback) {
    const componentPath = opts.componentPath,
      packageDir = path.resolve(componentPath, '_package'),
      compressedPackagePath = path.resolve(componentPath, 'package.tar.gz');

    callback = wrapCliCallback(callback);

    logger.warn(format(strings.messages.cli.PACKAGING, packageDir));
    const packageOptions = {
      componentPath: path.resolve(componentPath)
    };
    local.package(packageOptions, (err, component) => {
      if(err){
        logger.err(format(strings.errors.cli.PACKAGE_CREATION_FAIL, err));
        return callback(err);
      }

      logger.ok(format(strings.messages.cli.PACKAGED, packageDir));

      if (opts.compress) {
        logger.warn(format(strings.messages.cli.COMPRESSING, compressedPackagePath));

        local.compress(packageDir, compressedPackagePath, (err) => {
          if(err){
            logger.err(format(strings.errors.cli.PACKAGE_CREATION_FAIL, err));
            return callback(err);
          }
          logger.ok(format(strings.messages.cli.COMPRESSED, compressedPackagePath));
          callback(null, component);
        });
      } else {
        callback(null, component);
      }
    });
  };
};