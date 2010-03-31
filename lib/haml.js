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

var Haml = module.exports = function (haml) {

  // Normalize file endings
  haml = haml.trim() + "\n";
  
  var props = {};

  function combine(tokens) {
    var code = [];
    var last;
    tokens.map(function (token) {
      var tag;
      if (typeof token === 'string') {
        tag = token.substr(1, token.length - 2);
      } else {
        var contents = "";
        if (token._children) {
          contents = combine(token._children);
        }
        if (!token.open) {
          token = compileTag(token, true);
        }
        tag = token.open + contents + token.close;
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
    return code.join("\" + \"");

  }

  // Takes in haml code and outputs javascript code that generates the desired
  // HTML.
  function compile() {
    var state = 0;
    var start = 0;
    var i = 0, l = haml.length;
    var indent;
    
    function stateMachine(blockIndent) {
      var tokens = [];
      indent = blockIndent;
      for (;i < l;i++) {
        var c = haml[i];
        sys.puts("i:" + i + "/" + l + " state: " + state + " start: " + start + " c: " + JSON.stringify(c)+ " indent: " + indent + " blockIndent: " + blockIndent + " tokens.length: " + tokens.length);
        switch (state) {
          case 0: // Start state
            if (c === "\n") {
              indent = 0;
              continue;
            }
            if (c === " ") {
              indent++;
              continue;
            }
            if (c === '!' && haml.substr(i, 3) === '!!!') {
              start = i = i + 3;
              state = 5;
              continue;
            }
            if (/[^%#.]/.test(c)) {
              start = i;
              state = 2;
              if (indent > blockIndent) {
                sys.puts("INDENT");
                tokens[tokens.length - 1]._children = stateMachine(indent);
              }
              if (indent < blockIndent) {
                sys.puts("OUTDENT");
                return tokens;
              }
              continue;
            }
            if (/[%#.]/.test(c)) {
              start = i;
              state = 1;
              if (indent > blockIndent) {
                sys.puts("INDENT");
                tokens[tokens.length - 1]._children = stateMachine(indent);
              }
              if (indent < blockIndent) {
                sys.puts("OUTDENT");
                i--;
                return tokens;
              }
              continue;
            }
          break;
          case 1: // Tag def
            if (/[ \n{]/.test(c)) {
              tokens[tokens.length] = processTag(haml.substr(start, i-start));
              start = i;
              if (c === '{') {
                state = 3;
              } else if (/[^a-z0-9%#._-]/.test(c)) {
                state = 0;
                if (c === "\n") {
                  indent = 0;
                }
              }
            }
          break;
          case 2: // Raw Text
            if (c === "\n") {
              tokens[tokens.length] = JSON.stringify(haml.substr(start, i-start));
              start = i;
              indent = 0;
              state = 0;
            }
          case 3: // Tag attribute blocks
            if (c === '}') {
              tokens[tokens.length - 1] = processHash(tokens[tokens.length - 1], haml.substr(start, i - start + 1));
              state = 0;
            }
          break;
          case 5: // !!! short-tags
            if (c === "\n") {
              tokens[tokens.length] = JSON.stringify(processMacro(haml.substr(start, i - start)) + "\n");
              state = 0;
              start = i;
            }
          break;
        }
      }
      return tokens;
    }

    var tree = stateMachine(0);
    sys.puts("Tree", sys.inspect(tree, false, 100));
    return combine(tree);
  }

  // Breaks apart the shortcut section of a tag definition and returns an object
  function processTag(code) {
    var matches = code.match(/[%#.][a-z0-9_-]+/ig);
    if (!matches) {
      sys.error(sys.inspect(matches));
      return "";
      throw new Error("Invalid Tag: " + sys.inspect(code));
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
  function processHash(obj, code) {
    var start = 1, end = 0, length = code.length;
    while ((end = code.indexOf(':', start)) > 0) {
      var key = code.substr(start, end - start).trim();
      start = end + 1;
      while (end < length - 1 && code[end] !== ',') {
        end++;
      }
      var value = code.substr(start, end - start).trim();
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
        if (key in obj) {
          obj[key] = "htmlEscape(" + JSON.stringify(obj[key] + " ") + " + " + value + ")";
        } else {
          obj[key] = value;
        }
      }
      start = end + 1;
    }
    return obj;
  }

  function compileTag(obj, static) {
    var tag = obj._tag;
    var statics = obj._statics;
    delete obj._tag;
    delete obj._statics;
    delete obj._children;
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
      if (props.xml) {
        result.open = "<" + tag + attribs + " />";
      } else {
        result.open = "<" + tag + attribs + ">";
      }
    } else {
      result.open = "<" + tag + attribs + ">";
      result.close = "</" + tag + ">";
    }
    return result;
  }

  // Handles the !!! short-tags
  function processMacro(code) {
    code = code.trim().toLowerCase();
    if (code.substr(0, 3) === 'xml') {
      var encoding = code.substr(3).trim();
      encoding = encoding.length > 0 ? encoding : 'utf-8';
      return "<?xml version='1.0' encoding='" + encoding + "' ?>";
    };
    switch(code) {
      case 'transitional':
        props.xml = true;
        return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
      case 'strict': 
        props.xml = true;
        return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">';
      case 'frameset': 
        props.xml = true;
        return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">';
      case '1.1': 
        props.xml = true;
        return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';
      case 'basic': 
        props.xml = true;
        return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd">';
      case 'mobile': 
        props.xml = true;
        return '<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">';
      case '': // Default to HTML5
      case '5': 
        return '<!DOCTYPE html>';
      case '4':
      case '4 transitional':
        return '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">';
      case '4 strict':
        return '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">';
      case '4 frameset':
        return '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">';
    }
    return 'UNKNOWN';
  }

  var js = "  function htmlEscape(val) {\n" + 
    '    return val.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");\n' + 
    "  }\n" +
    "  with (locals || {}) {\n" + 
    "    return \"" + compile() + "\";\n" + 
    "  }";

  sys.puts("\n" + js + "\n");
  return new Function('locals', js);
  
}


var fs = require('fs');
var sys = require('sys');
var fn = Haml(fs.readFileSync('../test/html5.haml'));
sys.puts(fn());