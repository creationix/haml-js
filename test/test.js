var fs = require('fs');
var assert = require('assert');
var util = require('util');

var Haml = require("../lib/haml");

function compare(haml_file, haml, expected, scope, options){
  options || (options = {});
  try {
    util.puts(haml_file + " Begun")
    var js = Haml.compile(haml);
    var js_opt = Haml.optimize(js);
    var jsFn = Haml(haml, options);
    var actual = jsFn.call(scope.context, scope.locals);
               
    assert.equal(actual, expected);
    util.puts(haml_file + " Passed")
    
    actual = Haml.render(haml, {context:scope.context, locals:scope.locals})
    
    assert.equal(actual, expected);
    util.puts(haml_file + " Haml.render Passed")
    
  } catch (e) {
    var message = e.name;
    if (e.message) { message += ": " + e.message; }
    util.error(haml_file + " FAILED")
    util.error(message);
    util.error("\nJS:\n\n" + js);
    util.error("\nOptimized JS:\n\n" + js_opt);
    util.error("\nJS fn:\n\n"+jsFn.toString());
    util.error("\nStack:\n\n"+e.stack);
    try{
      util.error("\nActual["+actual.length+"]:\n\n" + actual);
      util.error("\nExpected["+expected.length+"]:\n\n" + expected);
    }catch(e2){}
    
    process.exit();
  }
}

// Load command line arguments to run a specific test
var test_param = [];

if (process.argv.length > 2) {
    for (var i = 2; i < process.argv.length; ++i) {
        test_param.push(process.argv[i].toLowerCase());
    }
}

fs.readdir('.', function (err, files) {
  files.forEach(function (haml_file) {
    if (test_param.length != 0 && test_param.indexOf(haml_file.toLowerCase()) === -1) {
        return;
    }
    
    var m = haml_file.match(/^(.*)\.haml/),
        base;
    if (!m) {
      return;
    }
    base = m[1];

    function load_haml(scope) {
      fs.readFile(haml_file, "utf8", function (err, haml) {
        fs.readFile(base + ".html", "utf8", function (err, expected) {
          compare(haml_file, haml, expected, scope)
        });
      });
    }

    // Load scope
    if (files.indexOf(base + ".js") >= 0) {
      fs.readFile(base + ".js", "utf8", function (err, js) {
        load_haml(eval("(" + js + ")"));
      });
    } else {
      load_haml({});
    }
  });
});

(function(){
  var haml_file = "alt_attribs.haml";
  
  if (test_param.length != 0 && test_param.indexOf(haml_file) === -1) {
    return;
  }
  
  var hamlSrc = fs.readFileSync(haml_file, "utf8");
  var includeEscape = Haml(hamlSrc).toString();
  var customEscape = Haml(hamlSrc, {customEscape:"$esc"}).toString();
  try{
    assert.ok(customEscape.length < includeEscape.length);
  }catch(e){
    util.error(e.stack);
    util.error(customEscape);
    process.exit();
  }
})();


(function(){
  if (test_param.length != 0 && test_param.indexOf("custom_escape.haml") === -1) {
    return;
  }
  
  var hamlSrc = fs.readFileSync("./other/custom_escape.haml", "utf8");
  var expected = fs.readFileSync("./other/custom_escape.html", "utf8");
  var scope = eval("(" + fs.readFileSync("escaping.js") + ")");
  
  util.puts("custom_escape" + " Begun")
  var jsFn = Haml(hamlSrc, {customEscape:"$esc"});
  
  this.$esc = function(){
    return "moo"
  };
  
  var actual = jsFn.call(scope.context, scope.locals); 
  try{           
    assert.equal(actual, expected);
  }catch(e){
    util.error("\nActual["+actual.length+"]:\n\n" + actual);
    util.error("\nExpected["+expected.length+"]:\n\n" + expected);
    process.exit();
  }
  util.puts("custom_escape" + " Passed")
  
})();


(function(){
  if (test_param.length != 0 && test_param.indexOf("escape_by_default.haml") === -1) {
    return;
  }
  
  var hamlSrc = fs.readFileSync("./other/escape_by_default.haml", "utf8");
  var expected = fs.readFileSync("./other/escape_by_default.html", "utf8");
  var scope = {};
  
  util.puts("escape_by_default" + " Begun")
  var js = Haml.compile(hamlSrc);  
  
  var jsFn = Haml(hamlSrc, {escapeHtmlByDefault:true});
  
  this.$esc = function(){
    return "moo"
  };
  
  var actual = jsFn.call(scope.context, scope.locals); 
  try{           
    assert.equal(actual, expected);
  }catch(e){
    util.error("\nActual["+actual.length+"]:\n\n" + actual);
    util.error("\nExpected["+expected.length+"]:\n\n" + expected);
    process.exit();
  }
  util.puts("escape_by_default" + " Passed")
  
})();

