var Q = require('q');
var promiseFromNodeFunc = Q.nfcall;

exports.serializeModules = serializeModules;

/**
 * Serializes a module tree, starting from an entry point.
 *
 * @param {string} entryPointName The name of the entry point module.
 * @param {function} resolve -- will receive one argument, the name of a module
 * @param callback
 */
function serializeModules(entryPointName, resolve, callback) {
  'use strict';

  loadModule([], {}, resolve, entryPointName).then(callback);
}

function promiseFromModuleNames(modules, modulePromises, resolve, names) {
  'use strict';

  return Q.all(names.map(function(name) {
    return loadModule(modules, modulePromises, resolve, name);
  })).get(0);
}

function addModule(module, modules) {
  'use strict';

  modules.push(module);
  return modules;
}

function addDependenciesAndModule(modules, modulePromises, resolve, module) {
  'use strict';

  return promiseFromModuleNames(
    modules,
    modulePromises,
    resolve,
    module.dependencies
  ).then(addModule.bind(null, module));
}

function moduleLoaded(modules, modulePromises, resolve, module) {
  'use strict';

  var dependencies = module.dependencies;
  return dependencies ?
    addDependenciesAndModule(modules, modulePromises, resolve, module) :
    addModule(module, modules);
}

function modulePromise(modules, modulePromises, resolve, name) {
  'use strict';

  return promiseFromNodeFunc(resolve, name)
    .then(function(module) {
      return moduleLoaded(modules, modulePromises, resolve, module);
    });
}
function loadModule(modules, modulePromises, resolve, name) {
  'use strict';

  if (!modulePromises.hasOwnProperty(name)) {
    return modulePromises[name] =
      modulePromise(modules, modulePromises, resolve, name);
  } else {
    return modulePromises[name];
  }
}
