# HAML-JS Changelog

- **0.1.2** - *2010-02-03* - Bug fixes, plugin aliases, CommonJS, and more...

  This is a big release with many improvements.  First haml-js is now a CommonJS module and is in the Tusk repository.  Thanks to Tom Robinson for helping with that.  Some of the plugins got aliases for people who didn't like the original name.  For example, you can now to `:javascript` instead of `:script` and fo `:for` instead of `:each`.  There were many bug fixes now that the code is starting to be actually used by myself and others.

  Added two quick plugins that make working with javascript and css much easier.


- **0.1.1** - *2010-01-09* - Add :css and :script plugins

  Added two quick plugins that make working with javascript and css much easier.

 - **0.1.0** - *2010-01-09* - Complete Rewrite

   Rewrote the compiler to be recursive and compile to JavaScript code instead of JSON data structures.  This fixes all the outstanding bugs and simplifies the code.  Pending is restoring the `:script` and `:css` plugins.

 - **0.0.1** - *2009-12-16* - Initial release

   Change how haml is packaged. It is a pure JS function with no node dependencies. There is an exports hook for commonjs usability. It's now the responsibility of the script user to acquire the haml text.


