module.exports = function(modules) {
  var map = {};
  return modules.reduce(function(map, module, i) {
    map[module.id] = '_' + i;
    return map;
  }, map);
};
