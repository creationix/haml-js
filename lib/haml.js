var Haml = {};

// Bind to the exports object if it exists. (CommonJS and NodeJS)
if (exports) {
  Haml = exports;
}

var self_close_tags = ["area", "base", "basefont", "br", "hr", "input", "img", "link", "meta"];

function instance_eval(text, context, locals) {
  var block;
  block = function () { with(context, locals || {}) { return eval("(" + text + ")"); } };
  return block.call(context);
}

function html_escape(text) {
  return text.
    replace(/&/g, "&amp;").
    replace(/</g, "&lt;").
    replace(/>/g, "&gt;").
    replace(/\"/g, "&quot;");
}

Haml.execute = function (data, locals) {
  if (!data) {
    return "";
  }
  return data.map(function (part) {
    var content, attribs = "";
    if (typeof part === 'string') {
      
      // Handle header shortcuts
      if (part.substr(0, 3) === '!!!') {
        switch (part.substr(4).toLowerCase()) {
          case 'xml':
            return "<?xml version='1.0' encoding='utf-8' ?>";
          case '':
            return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
          case '1.1':
            return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';
          case 'strict':
            return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">';
        }
      }

      // Handle escaped lines
      if (part[0] === '\\') {
        return part.substr(1, part.length);
      }

      // Handle dynamic content
      if (part[0] === '=') {
        return instance_eval(part.substr(1, part.length), this, locals);
      }
      
      // Handle plain text
      return part;
    }
    
    // Recursive call to render contents
    if (part.$) {
      content = Haml.execute.call(this, part.$, locals);
    }
    
    if (part.attribs || part.id || part["class"]) {
      if (part.attribs) {
        // Activate the attribs
        attribs = instance_eval(part.attribs, this, locals);
      } else {
        attribs = {};
      }

      if (part.id) {
        attribs.id = attribs.id ? part.id + " " + attribs : part.id;
      }

      if (part['class']) {
        attribs['class'] = attribs['class'] ? part['class'] + " " + attribs : part['class'];
      }

      attribs = " " + Object.keys(attribs).map(function (key) {
        return key + "=\"" + html_escape(attribs[key]) + "\"";
      }).join(" ");
    }
    
    
    // Format the output.
    if (content.length > 0 || self_close_tags.indexOf(part.tag) < 0) {
      return "<" + part.tag + attribs + ">" + content + "</" + part.tag + ">";
    } else {
      return "</" + part.tag + attribs + ">";
    }
  }).join("\n");
};

// Parse the attribute block using a state machine
function parse_attribs(line) {
  if (!(line.length > 0 && line.charAt(0) === '{')) {
    return {
      content: line[0] === ' ' ? line.substr(1, line.length) : line
    };
  }
  var l = line.length;
  var count = 1;
  var quote = false;
  var skip = false;
  for (var i = 1; count > 0; i += 1) {

    // If we reach the end of the line, then there is a problem
    if (i > l) {
      throw "Malformed attribute block";
    }

    var c = line.charAt(i);
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
        if (c === '{') {
          count += 1;
        }
        if (c === '}') {
          count -= 1;
        }
      }
    }
  }
  return {
    options: line.substr(0, i),
    content: line.substr(i, line.length)
  };
}
  
var matchers = [
  // html tags
  {
    regexp: /^(\s*)((?:[\.#%][a-z_-][a-z0-9_-]*)+)(.*)$/,
    process: function () {
      var tag, classes, ids, props, attribs, i;
      tag = this.matches[2];
      classes = tag.match(/\.([a-z_-][a-z0-9_-]*)/g);
      ids = tag.match(/\#([a-z_-][a-z0-9_-]*)/g);
      tag = tag.match(/\%([a-z_-][a-z0-9_-]*)/g);
      
      props = {
        tag: tag ? tag[0].substr(1, tag[0].length) : 'div'
      };
      
      attribs = this.matches[3];
      if (attribs) {
        attribs = parse_attribs(attribs);
        if (attribs.content) {
          this.contents.unshift(attribs.content);
        }
        if (attribs.options) {
          props.attribs = attribs.options;
        }
      }
      
      if (classes) {
        props['class'] = classes.map(function (klass) {
          return klass.substr(1, klass.length);
        }).join(' ');
      }
      if (ids) {
        props.id = ids.map(function (id) {
          return id.substr(1, id.length);
        }).join(' ');
      }
      
      props.$ = Haml.parse(this.contents);
      return props;
    }
  },
  
  // loops
  {
    regexp: /^(\s*):foreach([\{\s].*)?$/,
    process: function () {
      throw ":foreach Not Implemented";
    }
  }
];

Haml.parse = function (lines) {
  var block = false,
      output = [];
    
  // If lines is a string, turn it into an array
  if (typeof lines === 'string') {
    lines = lines.split("\n");
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
            process: matcher.process
          };
          found = true;
        }
      }
    });
    
    // Match plain text
    if (!found) {
      output.push(line);
    }
    
  });
  if (block) {
    output.push(block.process());
  }
  return output;
};

Haml.render = function(text, options) {
  options = options || {};
  var json = Haml.parse(text);
  return Haml.execute.call(options.context || GLOBAL, json, options.locals);
}
