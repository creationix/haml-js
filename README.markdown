# haml-js - Server side templating language for JavaScript

What's left in this project is the server-side haml language.  It has much of the same functionality as the traditional haml. Syntax based on [haml][] from the ruby world.

## NOTE, Project was split

If you're looking for the old haml-js (It was a jQuery plugin that made dom-building easy using a haml-like syntax), it's now renamed to [jquery-haml][]

## About the language

Here is the first example from the [haml][] site converted to haml-js:

**haml-js**

    .profile
      .left.column
        #date= print_date()
        #address= curent_user.address
      .right.column
        #email= current_user.email
        #bio= current_user.bio

**html**

    <div class="profile">
      <div class="left column">
        <div id="date">Thursday, October 8, 2009</div>
        <div id="address">Richardson, TX</div>
      </div>
      <div class="right column">
        <div id="email">tim@creationix.com</div>
        <div id="bio">Experienced software professional...</div>
      </div>
    </div>

Note that this works almost the same as ruby's [haml][].

## API

There are three exported functions in the haml.js library.  They are:

### parse(text) -> json data

Parse takes a block of haml template and parses it into an s-expression like json construct.

The following input:

    #home
      %ul.menu
        %li Go Home
        %li Go Back

Produces the following JSON output

    [{"tag":"div","id":"home"},
      [{"tag":"ul","class":"menu"},
        [{"tag":"li"},"Go Home"],
        [{"tag":"li"},"Go Back"]
      ]
    ]

### to_html(json) -> html text

This takes the json data from the parse step and converts it into html ready for a browser

The input from the previous example outputs this:

    <div id="home">
      <ul class="menu">
        <li>Go Home</li>
        <li>Go Back</li>
      </ul>
    </div>

### render(scope, filename, callback)

Render is a shortcut for the most common use of haml-js from within a node server.  It takes a scope, filename, and callback and calls the callback with the generated html when ready.

Scope is the custom scope for the JavaScript in the template.  Haml uses the "with" trick to make prefixing all variable and function references with "this".  So if I had a scope of {first: "Tim", last: "Caswell"}, then in the template the variables "first" and "last" would be available for use as local variables.

Since reading files is asynchronous in NodeJS, a Callback is required to pass the generated html to when done.

See test.js for an example usage of Haml.render

## Plugins

There are plugins in the parser for things like inline script tags, css blocks, and experimental support for if statements and for loops.  There are to be documented soon...

## Get Involved

If you want to use this project and something is missing then send me a message.  I'm very busy and have several open source projects I manage.  I'll contribute to this project as I have time, but if there is more interest for some particular aspect, I'll work on it a lot faster.  Also you're welcome to fork this project and send me patches/pull-requests.


[jquery-haml]: http://github.com/creationix/jquery-haml
[haml]: http://haml.hamptoncatlin.com/