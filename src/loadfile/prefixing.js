module.exports = function(loadFile, base, paths) {
  if (paths) {
    paths = keyValues(paths).map(cutTrailingSlash);
  }

  if (!endsWithSlash(base)) {
    base += '/';
  }

  return function(path, callback) {
    path = replacePrefix(paths, path);
    if (path.charAt(0) !== '/') {
      path = base + path;
    }
    loadFile(path, callback);
  }
};

function cutTrailingSlash(path) {
  return endsWithSlash(path) ? path.slice(0, -1) : path;
}

function replacePrefix(paths, path) {
  if (paths) {
    for (var i = 0, n = paths.length; i < n; i += 2) {
      var prefix = paths[i];
      if (startsWith(path, prefix)) {
        return path.replace(prefix, paths[i+1]);
      }
    }
  }
  return path;
}

function keyValues(object) {
  return Object.keys(object).reduce(function(keyValues, key) {
    keyValues.push(key, object[key]);
    return keyValues;
  }, []);
}

function endsWithSlash(string) {
  return string.charAt(string.length - 1) === '/';
}

function startsWith(string, start) {
  return string.lastIndexOf(start, 0) === 0;
}
