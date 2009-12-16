// Requires nodeJS 0.1.13 or greater to run <http://nodejs.org/>
// just type `node test.js` on the command line

// Load the haml-js library from the current directory
var Haml = require("./haml");
var file = require('file');
var sys = require('sys');

// Set up a scope for our view to render in
var scope = {
  print_date: function () {
    return (new Date()).toDateString();
  },
  current_user: {
    address: "Richardson, TX",
    email: "tim@creationix.com",
    bio: "Experienced software professional..."
  }
};

// Load, parse, and render the html.  The result it passed to the callback puts
// which prints it to the terminal.
file.read('test.haml').addCallback(function (source) {
  sys.puts(Haml.render(source, {
    locals: scope
  }));
});

