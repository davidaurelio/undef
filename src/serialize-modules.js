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

  var modules = [];
  loadModule(resolve, modules, callback, entryPointName)
}

function loadModule(resolve, modules, callback, name) {
  resolve(name, function(_, module) {
    modules.unshift(module);
    var deps = module.dependencies;
    if (deps) {
      deps.forEach(loadModule.bind(null, resolve, modules, callback));
    } else {
      callback(modules);
    }
  });
}
