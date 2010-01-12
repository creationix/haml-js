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
          try {
            var js = Haml.compile(haml);
            var js_opt = Haml.optimize(js);
            var actual = Haml.execute(js_opt, scope.context, scope.locals);
            assert.equal(actual, expected);
          } catch (e) {
            var message = e.name;
            if (e.message) message += ": " + e.message;
            puts(message);
            puts("\nJS:\n\n" + js);
            puts("\nOptimized JS:\n\n" + js_opt);
            puts("\nActual:\n\n" + actual);
            puts("\nExpected:\n\n" + expected);
          }
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


