var sys = require('sys');

var haml = "#hello_world";

// Breaks apart the shortcut section of a tag definition and returns an object
function processTag(haml) {
  var matches = haml.match(/[%#.][a-z0-9_-]+/ig);
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
    tag: tag || 'div'
  }
  if (id) {
    obj.id = JSON.stringify(id)
  }
  if (classes) {
    obj['class'] = JSON.stringify(classes.join(' '));
  }
  return obj;
}

function compileTag(obj) {
  sys.p(obj);
  
}

// Parses the JSON-like hash syntax and merges it with the base props
function processHash(obj, haml) {
  var start = 1, end = 0, length = haml.length;
  while ((end = haml.indexOf(':', start)) > 0) {
    var key = haml.substr(start, end - start).trim();
    start = end + 1;
    while (end < length - 1 && haml[end] !== ',') {
      end++;
    }
    var value = haml.substr(start, end - start).trim();
    if (key in obj) {
      obj[key] += " + " + val;
    } else {
      obj[key] = value;
    }
    start = end + 1;
  }
  return compileTag(obj);
}

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
        if (/[ {(]/.test(c)) {
          tokens[length] = processTag(haml.substr(start, i-start));
          length++;
          start = i;
          if (c === ' ') {
            state = 0;
          } else if (c === '{') {
            state = 3;
          } else if (c === '(') {
            state = 4;
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
          processHash(tokens[length - 1], haml.substr(start, i-start));
          start = i;
          state = 1;
        }
      break;
      case 4:
      if (c === ')') {
        processProps(tokens[length - 1], haml.substr(start, i-start));
        length++;
        start = i;
        state = 1;
      }
      break;
    }
  }
  sys.p(tokens);
  return tokens;
  
}

var Haml = module.exports = function (haml) {
  return new Function('locals', "with (locals) { return " + compile(haml) + "; }");
}
Haml.compile = compile;

compile('%html#id.class{ xmlns: "http://www.w3.org/1999/xhtml", more: 76, another: this.hi }');