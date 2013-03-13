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

  var serialization = new Serialization();
  resolve(entryPointName, serialization.addModule);

  callback(serialization.moduleList, serialization.moduleMap);
}

/**
 * @constructor
 */
function Serialization() {
  'use strict';

  this.moduleList = [];
  this.moduleMap = {};

  this.addModule = this.addModule.bind(this);
}

Serialization.prototype.addModule = function(module) {
  'use strict';

  var name = module.name;
  this.moduleList.push(name);
  this.moduleMap[name] = module.ast;
};
