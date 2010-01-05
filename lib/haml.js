var Haml = {};

// Bind to the exports object if it exists. (CommonJS and NodeJS)
if (exports) {
  Haml = exports;
}

var self_close_tags = ["area", "base", "basefont", "br", "hr", "input", "img", "link", "meta"];

Haml.execute = function (data) {
  puts(inspect(data));
  if (!data) {
    return "";
  }
  return data.map(function (part) {
    var content;
    if (typeof part === 'string') {
      return part;
    }
    if (part.$) {
      content = Haml.execute(part.$);
    }
    if (content.match(/\n/)) {
      return "<" + part.tag + ">\n" + content + "\n</" + part.tag + ">";
    } else {
      if (content.length > 0 || self_close_tags.indexOf(part.tag) < 0) {
        return "<" + part.tag + ">" + content + "</" + part.tag + ">";
      } else {
        return "</" + part.tag + ">";
      }
    }
  }).join("\n");
};

// Parse the attribute block using a state machine
function parse_attribs(line) {
  if (!(line.length > 0 && line.charAt(0) === '{')) {
    return {
      content: line.substr(1, line.length)
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
  var json = Haml.parse.call(options.context || GLOBAL, text, options.locals);
  return Haml.to_html(json).replace(/\n\n+/g, '\n');
}


// Read the sample haml out of the comment in the source
process.mixin(require('sys'));
var file = require('file');
file.read(process.ARGV[1]).addCallback(function (source) {
  var haml = (source.match(/HAML\n([\S\s]*)\nHAML/))[1];
  var output = Haml.parse(haml);
  puts("Output:");
  puts(inspect(output));
  puts(Haml.execute(output));
});

/*HAML
%div
  Does not close properly
  %div Nested same level as next div
%div
  Will be nested, but should be top level
HAML*/
