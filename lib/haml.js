var sys = require('sys');

var SELF_CLOSE = {
  meta: true,
  img: true,
  link: true,
  br: true,
  hr: true,
  input: true,
  area: true,
  base: true
};

function combine(tokens) {
  var code = [];
  var last;
  tokens.map(function (token) {
    var tag;
    if (typeof token === 'string') {
      tag = token.substr(1, token.length - 2);
    } else {
      if (!token.open) {
        token = compileTag(token, true);
      }
      sys.p(token);
      tag = token.open + token.close;
    }
    if (typeof token === 'string' || token.static) {
      if (last) {
        code[code.length - 1] += tag;
      } else {
        code[code.length] = tag;
      }
      last = true;
    } else {
      code[code.length] = tag;
      last = false;
    }
  });
  return "  function htmlEscape(val) {\n" + 
    '    return val.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");\n' + 
    "  }\n" +
    "  with (locals || {}) {\n" + 
    "    return \"" + code.join("\" + \"") + "\";\n" + 
    "  }";
  
}

// Takes in haml code and outputs javascript code that generates the desired
// HTML.
function compile(haml) {
  var state = 0;
  var tokens = [], length = 0;
  var start = 0;
  for (var i = 0, l = haml.length; i < l; i++) {
    var c = haml[i];
    switch (state) {
      case 0: // Start state
        if (c === "\n") {
          // Do a fast push
          tokens[length] = JSON.stringify(haml.substr(start, i-start));
          length++;
          // Skip the newline
          start = i = i + 1;
        }
        else if (/[%#.]/.test(c)) {
          state = 1;
          start = i;
        }
      break;
      case 1: // Tag def
        if (/[ \n{(]/.test(c)) {
          sys.puts("c: " + JSON.stringify(c) + ", Start: " + start + ", i: " + i + ", context: " + sys.inspect(haml.substr(start)));
          tokens[length] = processTag(haml.substr(start, i-start));
          length++;
          start = i;
          if (c === ' ' || c === '\n') {
            state = 0;
          } else if (c === '{') {
            state = 3;
          }
        }
      break;
      case 2: // Raw Text
        if (c === "\n") {
          // Do a fast push
          tokens[length] = JSON.stringify(haml.substr(start, i-start));
          length++;
          // Skip the newline
          start = i = i + 1;
          state = 0;
        }
      case 3:
        if (c === '}') {
          i++;
          tokens[length - 1] = processHash(tokens[length - 1], haml.substr(start, i-start));
          start = i;
          state = 1;
        }
      break;
    }
  }
  return combine(tokens);
}

// Breaks apart the shortcut section of a tag definition and returns an object
function processTag(haml) {
  var matches = haml.match(/[%#.][a-z0-9_-]+/ig);
  if (!matches) {
    sys.error(sys.inspect(matches));
    throw new Error("Invalid Tag: " + sys.inspect(haml));
  }
  var tag, id, classes = [];
  for (var i = 0, l = matches.length; i < l; i++) {
    var match = matches[i];
    switch(match[0]) {
      case '%':
        tag = match.substr(1);
        break;
      case '#':
        id = match.substr(1);
        break;
      case '.':
        classes.push(match.substr(1));
        break;
    }
  }
  if (!tag) {
    tag = 'div';
  }
  var obj = {
    _tag: tag || 'div'
  }
  obj._statics = {};
  if (id) {
    obj.id = id;
    obj._statics.id = true;
  }
  if (classes.length > 0) {
    obj['class'] = classes.join(' ');
    obj._statics['class'] = true;
  }
  return obj;
}

// Parses the JSON-like hash syntax and merges it with the base props
function processHash(obj, haml) {
  var allStatic = true;
  // sys.p("obj1", obj);
  var start = 1, end = 0, length = haml.length;
  while ((end = haml.indexOf(':', start)) > 0) {
    var key = haml.substr(start, end - start).trim();
    start = end + 1;
    while (end < length - 1 && haml[end] !== ',') {
      end++;
    }
    var value = haml.substr(start, end - start).trim();
    try {
      value = JSON.parse(value);
      obj._statics[key] = true;
      if (key in obj) {
        obj[key] += " " + value;
      } else {
        obj[key] = value;
      }
    } catch(e) {
      if (key in obj._statics) {
        delete obj._statics[key];
      }
      allStatic = false;
      if (key in obj) {
        obj[key] = "htmlEscape(" + JSON.stringify(obj[key] + " ") + " + " + value + ")";
      } else {
        obj[key] = value;
      }
    }
    start = end + 1;
  }
  return compileTag(obj, allStatic);
}

function compileTag(obj, static) {
  var tag = obj._tag;
  // sys.p("obj", obj);
  var statics = obj._statics;
  delete obj._tag;
  delete obj._statics;
  var attribs = [];
  for (var key in obj) {
    var value = obj[key];
    if (!statics[key]) {
      value = '" + ' + value + ' + "';
    }
    attribs[attribs.length] = key + '=\\"' + value + '\\"';
  }
  attribs = attribs.length > 0 ? " " + attribs.join(" ") : "";
  var result = {
    static: static,
  };
  if (SELF_CLOSE[tag]) {
    result.open = "<" + tag + attribs + " />";
  } else {
    result.open = "<" + tag + attribs + ">";
    result.close = "</" + tag + ">";
  }
  return result;
}


var Haml = module.exports = function (haml) {
  var code = compile(haml);
  // sys.puts("code:", code);
  
  return new Function('locals', code);
}
Haml.compile = compile;

// var fn = Haml('%html{ xmlns: "http://www.w3.org/1999/xhtml"}');
// sys.puts("html:", fn())