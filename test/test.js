var file = require('file');
var posix = require('posix');
var assert = require('assert');
process.mixin(require('sys'));

var Haml = require("../lib/haml");

posix.readdir('.').addCallback(function (files) {
  files.forEach(function (haml_file) {
    var m = haml_file.match(/^(.*)\.haml/),
        base;
    if (!m) {
      return;
    }
    base = m[1];

    function load_haml(scope) {
      file.read(haml_file).addCallback(function (haml) {
        file.read(base + ".html").addCallback(function (expected) {
          var actual = Haml.render(haml, scope);
          assert.equal(actual, expected);
        });
      });
    }

    // Load scope
    if (files.indexOf(base + ".js") >= 0) {
      file.read(base + ".js").addCallback(function (js) {
        load_haml(eval("(" + js + ")"));
      });
    } else {
      load_haml({});
    }
  });
});


