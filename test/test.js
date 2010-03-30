var fs = require('fs');
var assert = require('assert');
require('proto');
GLOBAL.mixin(require('sys'));

var Haml = require("../lib/haml");

fs.readdir('.', function (err, files) {
  files.forEach(function (haml_file) {
    if (haml_file !== 'standard.haml') return;
    var m = haml_file.match(/^(.*)\.haml/),
        base;
    if (!m) {
      return;
    }
    base = m[1];

    function load_haml(scope) {
      fs.readFile(haml_file, function (err, haml) {
        fs.readFile(base + ".html", function (err, expected) {
          try {
            var js = Haml.compile(haml);
            var fn = new Function('locals', js);
            puts(fn+"");
            var actual = fn.call(scope.context, scope.locals);
            assert.equal(actual, expected);
            puts(haml_file + " Passed")
          } catch (e) {
            var message = e.name;
            if (e.message) message += ": " + e.message;
            puts(e.stack || message);
            puts("\nJS:\n\n" + js);
            puts("\nActual:\n\n" + actual);
            puts("\nExpected:\n\n" + expected);
          }
        });
      });
    }

    // Load scope
    if (files.indexOf(base + ".js") >= 0) {
      fs.readFile(base + ".js", function (err, js) {
        load_haml(eval("(" + js + ")"));
      });
    } else {
      load_haml({});
    }
  });
});


