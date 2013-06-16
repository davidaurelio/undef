var buster = require('buster');
require('buster-more-assertions');

var loadfilePrefixing = require('../../src/loadfile/prefixing');
var assert = buster.assert;

buster.testCase('loadfile-prefixing', {
  'should return a function': function() {
    assert.isFunction(loadfilePrefixing(function() {}, 'arbitrary'));
  },

  'the created function': {
    'should prefix all modules with the base parameter and pass them to the wrapped loader': function() {
      var wrapped = this.spy();
      var base = 'base/path';
      var loadFile = loadfilePrefixing(wrapped, base);

      var path = 'arbitrary/path.js';
      loadFile(path);
      assert.calledWith(wrapped, base + '/' + path);
    },

    'should not insert a slash between base and path if base ends with a slash': function() {
      var wrapped = this.spy();
      var base = 'base/path/';
      var loadFile = loadfilePrefixing(wrapped, base);

      var path = 'arbitrary/path.js';
      loadFile(path);
      assert.calledWith(wrapped, base + path);
    },

    'should pass all values yielded by the wrapped loader to the callback': function() {
      var error = {};
      var data = 'arbitrary data';
      var wrapped = this.stub().yields(error, data);
      var loadFile = loadfilePrefixing(wrapped, 'arbitrary');

      var callback = this.spy();
      loadFile('arbitrary/path.js', callback);
      assert.calledWith(callback, error, data);
    },

    'should support path prefix replacement – ': {
      setUp: function() {
        this.wrapped = this.spy();
        this.base = 'base/path/';
        this.prefix = 'arbitrary/prefix';
        this.replacement = 'somewhere/else';
      },

      'replace prefixes in paths before prepending the base path': function() {
        var paths = makePaths(this.prefix, this.replacement);
        var loadFile = loadfilePrefixing(this.wrapped, this.base, paths);

        var subPath = '/some/path.js';
        loadFile(this.prefix + subPath);
        assert.calledWith(this.wrapped, this.base + this.replacement + subPath);
      },

      'should insert all needed slashes': function() {
        var prefix = 'arbitrary/prefix/'; // cuts one additional slash
        var paths = makePaths(prefix, this.replacement);

        var loadFile = loadfilePrefixing(this.wrapped, this.base, paths);

        var subPath = 'some/path.js';
        loadFile(prefix + subPath);
        assert.calledWith(this.wrapped, this.base + this.replacement + '/' + subPath);
      },

      'should not insert more slashes than necessary': function() {
        var replacement = 'somewhere/else/';
        var paths = makePaths(this.prefix, replacement);

        var loadFile = loadfilePrefixing(this.wrapped, this.base, paths);

        var subPath = '/some/path.js';
        loadFile(this.prefix + subPath);
        assert.calledWith(this.wrapped, this.base + replacement + subPath.slice(1));
      },

      'should not prepend the base if the substitution starts with a slash': function() {
        var replacement = '/somewhere/else';
        var paths = makePaths(this.prefix, replacement);

        var loadFile = loadfilePrefixing(this.wrapped, this.base, paths);

        var subPath = '/some/path.js';
        loadFile(this.prefix + subPath);
        assert.calledWith(this.wrapped, replacement + subPath);
      }
    }
  }
});

function makePaths(prefix, substitution) {
  var paths = {};
  paths[prefix] = substitution;
  return paths;
}
