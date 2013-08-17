exports.partial = function partial(fn, args) {
  var n = args.length;
  return function() {
    args.push.apply(args, arguments);
    var result = fn.apply(this, args);
    args.length = n;
    return result;
  }
};
