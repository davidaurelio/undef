var Q = require('q');
var promiseFromNodeFunc = Q.nfcall;

exports.serializeModules = serializeModules;

/**
 * Serializes a module tree, starting from an entry point.
 *
 * @param {string} entryPointName The name of the entry point module.
 * @param {function(string, function(?Error, Module=))} resolve A callback to
 *    resolve functions
 * @param {function(Array)} callback
 */
function serializeModules(entryPointName, resolve, callback) {
  'use strict';

  loadModule([], {}, resolve, entryPointName, []).then(callback);
}

function loadModules(modules, modulePromises, resolve, names, requestedBy) {
  'use strict';

  return Q.all(names.map(function(name) {
    return loadModule(modules, modulePromises, resolve, name, requestedBy);
  })).get(0);
}

function addModule(module, modules) {
  'use strict';

  modules.push(module);
  return modules;
}

function addDependenciesAndModule(modules, modulePromises, resolve, module, requestedBy) {
  'use strict';

  requestedBy = requestedBy.concat(module.name);
  return loadModules(modules, modulePromises, resolve, module.dependencies, requestedBy)
    .then(addModule.bind(null, module));
}

function moduleLoaded(modules, modulePromises, resolve, module, requestedBy) {
  'use strict';

  var dependencies = module.dependencies;
  if (dependencies) {
    dependencies = dependencies.filter(function(dependencyName) {
      return requestedBy.indexOf(dependencyName) === -1;
    });
  }
  return dependencies && dependencies.length ?
    addDependenciesAndModule(modules, modulePromises, resolve, module, requestedBy) :
    addModule(module, modules);
}

function modulePromise(modules, modulePromises, resolve, name, requestedBy) {
  'use strict';

  return promiseFromNodeFunc(resolve, name)
    .then(function(module) {
      return moduleLoaded(modules, modulePromises, resolve, module, requestedBy);
    });
}
function loadModule(modules, modulePromises, resolve, name, requestedBy) {
  'use strict';

  if (!modulePromises.hasOwnProperty(name)) {
    return modulePromises[name] =
      modulePromise(modules, modulePromises, resolve, name, requestedBy);
  } else {
    return modulePromises[name];
  }
}
