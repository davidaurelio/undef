exports.partial = function partial(fn, args) {
  'use strict';
  var n = args.length;
  return function() {
    args.push.apply(args, arguments);
    var result = fn.apply(this, args);
    args.length = n;
    return result;
  }
};

exports.keypath = function(object, key) {
  'use strict';
  for (var i = 1, n = arguments.length; defined(object) && i < n; i += 1) {
    object = object[arguments[i]];
  }
  return object;
};

function defined(value) {
  return value !== undefined && value !== null;
}
