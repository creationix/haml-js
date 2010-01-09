var Haml = {};

// Bind to the exports object if it exists. (CommonJS and NodeJS)
if (exports) {
  Haml = exports;
}

(function () {
  
  var matchers, self_close_tags;
  
  function html_escape(text) {
    if (typeof text !== 'string') {
      text = text + "";
    }
    return text.
      replace(/&/g, "&amp;").
      replace(/</g, "&lt;").
      replace(/>/g, "&gt;").
      replace(/\"/g, "&quot;");
  }

  function render_attribs(attribs) {
    var key, value, result = [];
    for (key in attribs) {
      if (key !== 'content' && attribs.hasOwnProperty(key)) {
        switch (attribs[key]) {
        case 'undefined':
        case 'false':
        case 'null':
        case '""':
          break;
        default:
          try {
            value = JSON.parse("(" + attribs[key] +")");  
            if (value === true) {
              value = key;
            }
            result.push(" " + key + '=\\"' + html_escape(value) + '\\"');
          } catch (e) {
            result.push(" " + key + '=\\"" + html_escape(' + attribs[key] + ') + "\\"');
          }
        }
      }
    }
    return result.join("");
  }

  // Parse the attribute block using a state machine
  function parse_attribs(line) {
    var attributes = {},
        l = line.length,
        i, c,
        count = 1,
        quote = false,
        skip = false,
        pair = {
          start: 1,
          middle: null,
          end: null
        };

    if (!(l > 0 && line.charAt(0) === '{')) {
      return {
        content: line[0] === ' ' ? line.substr(1, l) : line
      };
    }
  
    function process_pair() {
      var key = line.substr(pair.start, pair.middle - pair.start).trim(),
          value = line.substr(pair.middle + 1, pair.end - pair.middle - 1).trim();
      attributes[key] = value;
      pair = {
        start: null,
        middle: null,
        end: null
      };
    }
  
    for (i = 1; count > 0; i += 1) {

      // If we reach the end of the line, then there is a problem
      if (i > l) {
        throw "Malformed attribute block";
      }

      c = line.charAt(i);
      if (skip) {
        skip = false;
      } else {
        if (quote) {
          if (c === '\\') {
            skip = true;
          }
          if (c === quote) {
            quote = false;
          }
        } else {
          if (c === '"' || c === "'") {
            quote = c;
          }

          if (count === 1) {
            if (c === ':') {
              pair.middle = i;
            }
            if (c === ',' || c === '}') {
              pair.end = i;
              process_pair();
              if (c === ',') {
                pair.start = i + 1;
              }
            }
          }

          if (c === '{') {
            count += 1;
          }
          if (c === '}') {
            count -= 1;
          }
        }
      }
    }
    attributes.content = line.substr(i, line.length);
    return attributes;
  }

  self_close_tags = ["meta", "img", "link", "script", "br", "hr"];

  // All matchers' regexps should capture leading whitespace in first capture
  // and trailing content in last capture
  matchers = [
    // html tags
    {
      regexp: /^(\s*)((?:[.#%][a-z_\-][a-z0-9_\-]*)+)(.*)$/i,
      process: function () {
        var tag, classes, ids, attribs, content;
        tag = this.matches[2];
        classes = tag.match(/\.([a-z_\-][a-z0-9_\-]*)/g);
        ids = tag.match(/\#([a-z_\-][a-z0-9_\-]*)/g);
        tag = tag.match(/\%([a-z_\-][a-z0-9_\-]*)/g);

        // Default to <div> tag
        tag = tag ? tag[0].substr(1, tag[0].length) : 'div';
    
        attribs = this.matches[3];
        if (attribs) {
          attribs = parse_attribs(attribs);
          if (attribs.content) {
            this.contents.unshift(attribs.content);
            delete(attribs.content);
          }
        } else {
          attribs = {};
        }
    
        if (classes) {
          classes = classes.map(function (klass) {
            return klass.substr(1, klass.length);
          }).join(' ');
          if (attribs['class']) {
            try {
              attribs['class'] = JSON.stringify(classes + " " + JSON.parse(attribs['class']));
            } catch (e) {
              attribs['class'] = JSON.stringify(classes + " ") + " + " + attribs['class'];
            }
          } else {
            attribs['class'] = JSON.stringify(classes);
          }
        }
        if (ids) {
          ids = ids.map(function (id) {
            return id.substr(1, id.length);
          }).join(' ');
          if (attribs.id) {
            attribs.id = JSON.stringify(ids + " ") + attribs.id;
          } else {
            attribs.id = JSON.stringify(ids);
          }
        }
      
        attribs = render_attribs(attribs);
      
        content = this.render_contents();
        if (content === '""') {
          content = '';
        }

        if (content.length > 0 && self_close_tags.indexOf(tag) < 0) {
          return '"<' + tag + attribs + '>" + \n' + content + ' + \n"</' + tag + '>"';
        } else {
          return '"<' + tag + attribs + ' />"';
        }
      }
    },

    // each loops
    {
      regexp: /^(\s*):each\s+(?:([a-z_][a-z_\-]*),\s*)?([a-z_][a-z_\-]*)\s+in\s+([a-z_][a-z_\-]*)(.*)$/i,
      process: function () {
        var ivar = this.matches[2] || '__key__', // index
            vvar = this.matches[3],              // value
            avar = this.matches[4],              // array
            rvar = '__result__';                 // results
      
        if (this.matches[5]) {
          this.contents.unshift(this.matches[5]);
        }
        return '(function () { ' +
          'var ' + rvar + ' = [], ' + ivar + ', ' + vvar + '; ' +
          'for (' + ivar + ' in ' + avar + ') { ' +
          'if (' + avar + '.hasOwnProperty(' + ivar + ')) { ' +
          vvar + ' = ' + avar + '[' + ivar + ']; ' +
          rvar + '.push(\n' + (this.render_contents() || "''") + '\n); ' +
          '} } return ' + rvar + '.join(""); }())';
      }
    },
  
    // if statements
    {
      regexp: /^(\s*):if\s+(.*)\s*$/i,
      process: function () {
        var condition = this.matches[2];
        return '(function () { ' +
          'if (' + condition + ') {\n' +
          'return (\n' + (this.render_contents() || '') + '\n);\n' +
          '} else { return ""; } }())';
      }
    },
  
    // declarations
    {
      regexp: /^()!!!(?:\s*(.*))\s*$/,
      process: function () {
        var line = '';
        switch ((this.matches[2] || '').toLowerCase()) {
        case '':
          // XHTML 1.0 Transitional
          line = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
          break;
        case 'strict':
        case '1.0':
          // XHTML 1.0 Strict
          line = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">';
          break;
        case 'frameset':
          // XHTML 1.0 Frameset
          line = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">';
          break;
        case '5':
          // XHTML 5
          line = '<!DOCTYPE html>';
          break;
        case '1.1':
          // XHTML 1.1
          line = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';
          break;
        case 'basic':
          // XHTML Basic 1.1
          line = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd">';
          break;
        case 'mobile':
          // XHTML Mobile 1.2
          line = '<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">';
          break;
        case 'xml':
          // XML
          line = "<?xml version='1.0' encoding='utf-8' ?>";
          break;
        case 'xml iso-8859-1':
          // XML iso-8859-1
          line = "<?xml version='1.0' encoding='iso-8859-1' ?>";
          break;
        }
        return JSON.stringify(line + "\n");
      }
    }
  
  ];

  Haml.compile = function (lines) {
    var block = false,
        output = [];
    
    // If lines is a string, turn it into an array
    if (typeof lines === 'string') {
      lines = lines.trim().split("\n");
    }

    lines.forEach(function(line) {
      var match, found = false;

      // Collect all text as raw until outdent
      if (block) {
        match = block.check_indent(line);
        if (match) {
          block.contents.push(match[1] || "");
          return;
        } else {
          output.push(block.process());
          block = false;
        }
      }
    
      matchers.forEach(function (matcher) {
        if (!found) {
          match = matcher.regexp(line);
          if (match) {
            block = {
              contents: [],
              matches: match,
              check_indent: new RegExp("^(?:\\s*|" + match[1] + "  (.*))$"),
              process: matcher.process,
              render_contents: function () {
                return Haml.compile(this. contents);
              }
            };
            found = true;
          }
        }
      });
    
      // Match plain text
      if (!found) {
        output.push(function () {
          // Escaped plain text
          if (line[0] === '\\') {
            return JSON.stringify(line.substr(1, line.length) + "\n");
          }
          
          // Plain variable data
          if (line[0] === '=') {
            line = line.substr(1, line.length).trim();
            try {
              return JSON.stringify(JSON.parse(line) +"\n");
            } catch (e) {
              return line + ' +\n"\\n"';
            }
          }

          // HTML escape variable data
          if (line.substr(0, 2) === "&=") {
            line = line.substr(2, line.length).trim();
            try {
              return JSON.stringify(html_escape(JSON.parse(line)) +"\n");
            } catch (e2) {
              return 'html_escape(' + line + ') +\n"\\n"';
            }
          }

          // Plain text
          return JSON.stringify(line + "\n");
        }());
      }
    
    });
    if (block) {
      output.push(block.process());
    }
    return output.join(' + \n');
  };
  
  Haml.optimize = function (js) {
    var new_js = [], buffer = [], part, end;
    
    function flush() {
      if (buffer.length > 0) {
        new_js.push(JSON.stringify(buffer.join("")) + end);
        buffer = [];
      }
    }
    js.split("\n").forEach(function (line) {
      part = line.match(/^(\".*\")(\s*\+\s*)?$/);
      if (!part) {
        flush();
        new_js.push(line);
        return;
      }
      end = part[2] || "";
      part = part[1];
      try {
        buffer.push(JSON.parse(part));
      } catch (e) {
        flush();
        new_js.push(line);
      }
    });
    flush();
    return new_js.join("\n");
  };

  Haml.render = function(text, options) {
    options = options || {};
    var js = Haml.compile(text);
    if (options.optimize) {
      js = Haml.optimize(js);
    }
    return Haml.execute(js, options.context || Haml, options.locals);
  };

  Haml.execute = function (js, self, locals) {
    return (function () {
      with(locals || {}) {
        return eval("(" + js + ")");
      }
    }).call(self);
  };


}());
