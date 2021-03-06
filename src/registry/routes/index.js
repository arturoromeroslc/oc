'use strict';

const async = require('async');
const _ = require('lodash');

const dateStringified = require('../../utils/date-stringify');
const packageInfo = require('../../../package.json');
const urlBuilder = require('../domain/url-builder');

module.exports = function(repository){
  return function(req, res, next){

    repository.getComponents((err, components) => {
      if(err){
        res.errorDetails = 'cdn not available';
        return res.status(404).json({ error: res.errorDetails });
      }

      const isHtmlRequest = !!req.headers.accept && req.headers.accept.indexOf('text/html') >= 0,
        baseResponse = {
          href: res.conf.baseUrl,
          ocVersion: packageInfo.version,
          type: res.conf.local ? 'oc-registry-local' : 'oc-registry'
        };

      if(isHtmlRequest && !!res.conf.discovery){

        let componentsInfo = [], componentsReleases = 0;
        const stateCounts = {};

        async.each(components, (component, callback) => repository.getComponent(component, (err, result) => {
          if(err){ return callback(err); }

          if(result.oc && result.oc.date) {
            result.oc.stringifiedDate = dateStringified(new Date(result.oc.date));
          }

          componentsInfo.push(result);
          componentsReleases += result.allVersions.length;
          callback();
        }), (err) => {
          if(err){ return next(err); }

          componentsInfo = _.sortBy(componentsInfo, 'name');

          return res.render('index', _.extend(baseResponse, {
            availableDependencies: res.conf.dependencies,
            availablePlugins: res.conf.plugins,
            components: componentsInfo,
            componentsReleases,
            componentsList: _.map(componentsInfo, (component) => {

              const state = (!!component.oc && !!component.oc.state) ? component.oc.state : '';

              if(state){
                stateCounts[state] = stateCounts[state] || 0;
                stateCounts[state] += 1;
              }

              return {
                name: component.name,
                state
              };
            }),
            q: req.query.q || '',
            stateCounts
          }));
        });
      } else {
        res.status(200).json(_.extend(baseResponse, {
          components: _.map(components, (component) => urlBuilder.component(component, res.conf.baseUrl))
        }));
      }
    });
  };
};
