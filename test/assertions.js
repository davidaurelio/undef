var assertions = exports.assertions = {
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

    assertMessage: 'expected ${0} to contain ${1} in order',
    refuteMessage: 'expected ${0} not to contain ${1} in order',
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
