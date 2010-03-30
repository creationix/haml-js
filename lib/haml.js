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
        else if (haml.substr(i, 3) === '!!!') {
          start = i = i + 3;
          state = 5;
        }
      break;
      case 1: // Tag def
        if (/[ \n{(]/.test(c)) {
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
      case 5:
        if (c === "\n") {
          tokens[length] = JSON.stringify(processMacro(haml.substr(start, i - start).trim().toLowerCase())+"\n");
          length++;
          state = 0;
          start = i;
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
    return "";
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

function processMacro(haml) {
  var xml;

  if (haml.substr(0, 3) === 'xml') {
    var encoding = haml.substr(3).trim();
    encoding = encoding.length > 0 ? encoding : 'utf-8';
    return "<?xml version='1.0' encoding='" + encoding + "' ?>";
  };
  switch(haml) {
    case 'transitional':
      xml = true;
      return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
    case 'strict': 
      xml = true;
      return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">';
    case 'frameset': 
      xml = true;
      return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">';
    case '1.1': 
      xml = true;
      return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';
    case 'basic': 
      xml = true;
      return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd">';
    case 'mobile': 
      xml = true;
      return '<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">';
    case '': // Default to HTML5
    case '5': return '<!DOCTYPE html>';
    case '4':
    case '4 transitional':
      return '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">';
    case '4 strict':
      return '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">';
    case '4 frameset':
      return '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">';
  }
  return '';
}


var Haml = module.exports = function (haml) {
  var code = compile(haml);
  
  return new Function('locals', code);
}
Haml.compile = compile;

