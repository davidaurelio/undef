var buster = require('buster');

var assert = buster.assert;

buster.testCase('idmap', {
  'returns an object without properties for zero modules': function() {
    assert.equals(idmap([]), {});
  },

  'with one module:': {
    'returns an object containing the module id as property': function() {
      var id = 'arbitrary/id';
      var map = idmap([module(id)]);
      assert.equals(Object.keys(map), [id]);
    },

    'the value of the property is a valid identifier (as string)': function() {
      var id = 'arbitrary/id';
      var map = idmap([module(id)]);
      assert.match(map[id], /^[a-z]\w*$/i);
    }
  }
});


function module(id) {
  return {id: id};
}

function idmap(modules) {
  if (!modules.length) return {};

  var map = {};
  map[modules[0].id] = null;
  return map;
}
