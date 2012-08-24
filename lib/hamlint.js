#!/usr/bin/env node

if (process.argv.length != 3) {
    process.stderr.write("usage: hamlint file.haml\n");
    process.stderr.write('\nYou can add context information in first line of the file:\n\n');
    process.stderr.write('-#lint-input {context_var1:"",context_var2:""}\n');
    process.exit(1);
}
var fs = require('fs');
var fname = process.argv[2];
allhaml = fs.readFileSync(fname,'utf-8');
var Haml = require('./haml');


var lines = allhaml.split("\n");
var issues = {};
var input = "{}";
var tag = "-#lint-input";
result = "";
Haml("");
var html_escape = function(a){return a;};
var indent = function(a) { return "    "+a.split("\n").join("\n    ");}
if (lines[0].indexOf(tag)===0) {
    issues[0] = "lint input line";
    try {
	input = lines[0].substr(tag.length);
	eval(input);
    }catch (err) {
	issues[i] = err;
	result+=fname+":1: error: "+err;
    }
}

try { /* first try to quickly compile the whole file */
    var js = Haml.optimize(Haml.compile(allhaml));
    var str = "with("+input+") { "+js+"}";
    str = eval(str);
    process.stdout.write("[haml template OK]\n");
    try { /* if beautifier is installed, we run it.. */
	str = indent(require("beautifier").html_beautify(str));
    } catch(err) {}
    process.stdout.write(str+"\n");
    process.exit(0);
} catch (err) {}

for (var i=0;i<lines.length;i+=1) {
    haml = "";
    for (var j=0;j<=i;j+=1) {
	/* skip problematic lines */
	if (!issues.hasOwnProperty(j)) {
	    haml+=lines[j]+"\n";
	}
    }
    try {
	var js = Haml.optimize(Haml.compile(haml));
	var str = "with("+input+") { "+js+"}";
	eval(str);
    }catch (err) {
	issues[i] = err;
	result+=fname+":"+(i+1)+": error: "+err+"\n"+indent(js)+"\n";
    }
}
process.stderr.write(result);

