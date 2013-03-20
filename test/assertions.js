var assertions = exports.assertions = {
  containsOnce: {
    assert: function(array, value) {
      var index = array.indexOf(value);
      return index !== -1 && array.indexOf(value, index + 1) === -1;
    },
    expectation: 'toContainOnce',
    assertMessage: 'Expected [${0}] to contain ${1} once',
    refuteMessage: 'Expected [${0}] not to contain ${1} exavtly once'
  },

  containsInOrder: {
    assert: function(sequence, a, b) {
      var i = 3, iMax = arguments.length;
      do {
        if (sequence.indexOf(b) < sequence.indexOf(a)) {
          return false;
        }
        a = b;
        b = arguments[i];
        i += 1;
      } while(i < iMax);

      return true;
    },
    expectation: 'toContainInOrder',
    assertMessage: 'Expected [${0}] to contain ${1} in order',
    refuteMessage: 'Expected [${0}] not to contain ${1} in order',
    values: function(sequence) {
      return [sequence, [].slice.call(arguments, 1).join(', ')];
    }
  }
};

exports.addAll = function(busterAssertions) {
  Object.keys(assertions).forEach(function(name) {
    busterAssertions.add(name, assertions[name]);
  });
};
