var Q = require('q');

exports.serializeModules = serializeModules;

/**
 * Serializes a module tree, starting from an entry point.
 *
 * @param {Array} entryPointNames The names of the entry point modules.
 * @param {function(string, function(?Error, Module=))} resolve A callback to
 *    resolve functions
 * @param {function(Array)} callback
 */
function serializeModules(entryPointNames, resolve, callback) {
  'use strict';

  load(Q.denodeify(resolve), entryPointNames).nodeify(callback);
}

function startsWith(haystack, needle) {
  return haystack.lastIndexOf(needle, 0) === 0;
}

function id(o) {
  return o;
}

function load(resolve, entryPointNames) {
  var modules = [], modulePromises = {};

  function loadModules(names, requestedBy) {
    'use strict';

    return Q.all(names.map(function(name) {
      return loadModule(name, requestedBy);
    })).spread(id);
  }

  function addModule(module) {
    'use strict';

    modules.push(module);
    return modules;
  }

  function addDependenciesAndModule(module, requestedBy) {
    'use strict';

    requestedBy = requestedBy.concat(module.name);
    return loadModules(module.dependencies, requestedBy)
      .then(addModule.bind(null, module));
  }

  function moduleLoaded(module, requestedBy) {
    'use strict';

    var dependencies = module.dependencies;
    if (dependencies) {
      dependencies = dependencies.filter(function(dependencyName) {
        return requestedBy.indexOf(dependencyName) === -1;
      });
    }
    return dependencies && dependencies.length ?
      addDependenciesAndModule(module, requestedBy) :
      addModule(module);
  }

  function modulePromise(name, requestedBy) {
    'use strict';

    return resolve(name)
      .then(function(module) {
        return moduleLoaded(module, requestedBy);
      });
  }

  function loadModule(name, requestedBy) {
    'use strict';

    if (startsWith(name, '../') || startsWith(name, './')) {
      return Q.reject(Error('Relative module name passed'));
    }

    if (!modulePromises.hasOwnProperty(name)) {
      modulePromises[name] =
        modulePromise(name, requestedBy);
    }

    return modulePromises[name];
  }

  return loadModules(entryPointNames, []);
}
