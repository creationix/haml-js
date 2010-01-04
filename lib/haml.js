var Haml = {};

// Bind to the exports object if it exists. (CommonJS and NodeJS)
if (exports) {
  Haml = exports;
}

var self_close_tags = ["area", "base", "basefont", "br", "hr", "input", "img", "link", "meta"];

Haml.execute = function (data, locals) {
  throw "Not implemented";
}

function parse_plugin(line) {
  var m = line.match(/^(\s*):([^ ]+)/);
  return {
    type: m[2],
    term: m[1],
    buffer: []
  };
}

Haml.parse = function (text, locals) {
  var plugin = false;
  text.split("\n").forEach(function(line) {
    
    // Special plugin mode filter
    if (plugin) {
      debug(inspect(plugin));
      if (line.indexOf(plugin.term) === 0) {
        plugin = false;
      } else {
        plugin.buffer.push(line);
        return;
      }
    }
    
    // Ignore blank lines
    if (line.match(/^\s*$/)) {
      return;
    }
    
    if (line.match(/^\s*:/)) {
      plugin = parse_plugin(line);
    }
    puts(line);
  });
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
  puts(inspect(json));
  puts(inspect(Haml.parse(haml)));

});

/*HAML

  
      
      
%div   
  Does not close properly
  %div Nested same level as next div
  :foreach
    jj
    kk
    kk
%div   
  Will be nested, but should be top level

HAML*/
var json = [
  {
    tag: "div",
    contents: [
      "Does not close properly",
      {
        tag: "div",
        contents: [
          "Nested same level as next div"
        ]
      }
    ]
  },
  {
    tag: "div",
    contents: [
      "Will be nested, but should be top level"
    ]
  }
];
