# HAML-JS Changelog

 - **0.1.0** - *2010-01-09* - Complete Rewrite

   Rewrote the compiler to be recursive and compile to JavaScript code instead of JSON data structures.  This fixes all the outstanding bugs and simplifies the code.  Pending is restoring the `:script` and `:css` plugins.

 - **0.0.1** - *2009-12-16* - Initial release

   Change how haml is packaged. It is a pure JS function with no node dependencies. There is an exports hook for commonjs usability. It's now the responsibility of the script user to acquire the haml text.
   

