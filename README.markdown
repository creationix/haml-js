# haml-js - Server side templating language for JavaScript

Ever wanted to use the excellent HAML syntax on a javascript project?  Me too, so I made one!.  This has most of the same functionality as the traditional [haml][].

## About the language

Here is the first example(with a little extra added) from the [haml][] site converted to haml-js:

**haml-js**

    !!! XML
    !!! strict
    %html{ xmlns: "http://www.w3.org/1999/xhtml" }
      %head
        %title Sample haml template
      %body
        .profile
          .left.column
            #date= print_date()
            #address= current_user.address
          .right.column
            #email= current_user.email
            #bio= current_user.bio

**html**

    <?xml version='1.0' encoding='utf-8' ?>
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml"><head><title>Sample haml template
    </title></head><body><div class="profile"><div class="left column"><div id="date">January 1, 2009
    </div><div id="address">Richardson, TX
    </div></div><div class="right column"><div id="email">tim@creationix.com
    </div><div id="bio">Experienced software professional...
    </div></div></div></body></html>

Note that this works almost the same as ruby's [haml][], but doesn't pretty print the html.  This would greatly slow down and complicate the code.  If you really want pretty printed html, then I suggest writing one using the xml parser library and process the resulting html..

## API

There are four exported functions in the haml.js library.  They are:

### Haml.compile(text) -> JavaScript compiled template

Given a haml template as raw text, this compiles it to a javascript expression
that can later be eval'ed to get the final HTML.

The following input:

    #home
      = title
      %ul.menu
        %li Go Home
        %li Go Back

Produces the following JavaScript expression:

    "<div id=\"home\">" + 
    title +
    "\n" + 
    "<ul class=\"menu\">" + 
    "<li>" + 
    "Go Home\n" + 
    "</li>" + 
    "<li>" + 
    "Go Back\n" + 
    "</li>" + 
    "</ul>" + 
    "</div>"

### Haml.optimize(js) -> optimized JavaScript expression

Takes the output of compile and optimizes it to run faster with the tradeoff of longer compile time.  This is useful for framework developers wanting to use haml in their framework and want to cache the compiled templates for performance.

With the previous input it outputs:

    "<div id=\"home\">" + 
    title +
    "\n<ul class=\"menu\"><li>Go Home\n</li><li>Go Back\n</li></ul></div>"

Notice how congruent static strings are merged into a single string literal when possible.

### Haml.execute(js, context, locals) -> Executes a compiles template

Context is the value of `this` in the template, and locals is a hash of local variables.

### Haml.render(text, options) -> html text

This is a convenience function that compiles and executes to html in one shot.  Most casual users will want to use this function exclusively.

The `text` parameter is the haml source already read from a file.

The three recognized `options` are:

 - **context**: This is the `this` context within the haml template.
 - **locals**: This is an object that's used in the `with` scope.  Basically it creates local variables and function accessible to the haml template.
 - **optimize**: This is a flag to tell the compiler to use the extra optimizations.
 
See [test.js][] for an example usage of Haml.render

## Plugins

There are plugins in the parser for things like inline script tags, css blocks, and support for if statements and for loops.

### `:if` statements

`if` statements evaluate a condition for truthiness (as opposed to a strict comparison to `true`) and includes the content inside the block if it's truthy.

    :if todolist.length > 20
      %p Oh my, you are a busy fellow!

### `:each` loops

`:each` loops allow you to loop over a collection including a block of content once for each item. You need to what variable to pull the data from and where to put the index and value.  The index variable is optional and defaults to `__key__`.

Here is an example over a simple array.

    %ul.todolist
      :each item in todolist
        %li= item.description

You can loop over the keys and values of objects too (Note the inner `:each` loop)

    :each item in data
      :if item.age < 100
        %dl
          :each name, value in item
            %dt&= name
            %dd&= value

### `:css` and `:javascript` helpers.

It's easy to embed javascript and css blocks in an haml document.

    %head
      :javascript
        function greet(message) {
          alert("Message from MCP: " + message);
        }
      %title Script and Css test
      :css
        body {
          color: pink;
        }
    %body{ onload: "greet(\"I'm Pink\")" } COLOR ME PINK

This compiles to the following HTML:

    <head>
    <script type="text/javascript">
    //<![CDATA[
      function greet(message) {
        alert("Message from MCP: " + message);
      }
    //]]>
    </script>
    <title>Script and Css test
    </title>
    <style type="text/css">
      body {
        color: pink;
      }
    </style>
    </head><body onload="greet(&quot;I'm Pink&quot;)"> COLOR ME PINK
    </body>

## Get Involved

If you want to use this project and something is missing then send me a message.  I'm very busy and have several open source projects I manage.  I'll contribute to this project as I have time, but if there is more interest for some particular aspect, I'll work on it a lot faster.  Also you're welcome to fork this project and send me patches/pull-requests.

## License

Haml-js is [licensed][] under the [MIT license][].

[MIT license]: http://creativecommons.org/licenses/MIT/
[licensed]: http://github.com/creationix/haml-js/blob/master/LICENSE
[jquery-haml]: http://github.com/creationix/jquery-haml
[haml]: http://haml-lang.com/
[test.js]: http://github.com/creationix/haml-js/blob/master/test/test.js

## TODO

haml-js doesn't have nearly all the features of the original ruby version.  Here is a list of features not implemented that I may do someday if someone desires them.

 - HTML comments
   - IE conditional comments
 - Haml comments
 - Arbitrary code "-" prefix
 - Whitespace Preservation: ~
 - Ruby Interpolation: #{}

 
 
