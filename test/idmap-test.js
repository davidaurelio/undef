var buster = require('buster');
require('./assertions').addAll(buster.assertions);

var idmap = require('../src/idmap');

var assert = buster.assert;
var reIdentifier = /^[_a-z]\w*$/i;

buster.testCase('idmap', {
  'returns an object without properties for zero modules': function() {
    assert.equals(idmap([]), {});
  },

  'with one module:': {
    setUp: function() {
      var id = this.id = 'arbitrary/id';
      this.map = idmap([module(id)]);
    },
    'returns an object containing the module id as property': function() {
      assert.equals(Object.keys(this.map), [this.id]);
    },

    'the value of the property is a valid identifier (as string)': function() {
      assert.match(this.map[this.id], reIdentifier);
    }
  },

  'with multiple modules': {
    setUp: function() {
      var ids = this.ids = ['arbitrary/id1', 'arbitrary/id2', 'arbitrary/id3'];
      this.map = idmap(ids.map(module));
    },
    'returns an object that contains all module ids as properties': function() {
      assert.equals(Object.keys(this.map), this.ids);
    },

    'all property values are valid identifiers': function() {
      values(this.map).forEach(function(identifier) {
        assert.match(identifier, reIdentifier);
      })
    },

    'all property values are distinct': function() {
      values(this.map).forEach(function(identifier, _, identifiers) {
        assert.containsOnce(identifiers, identifier);
      });
    }
  }
});

function values(object) {
  return Object.keys(object).map(function(key) {
    return object[key];
  });
}

function module(id) {
  return {id: id};
}
