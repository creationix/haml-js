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

### render(text, options) -> html text

This is a convenience function that parses and converts to html in one shot.

The `text` parameter is the haml source already read from a file.

The two recognized `options` are:

 - **context**: This is the `this` context within the haml template.
 - **locals**: This is an object that's used in the `with` scope.  Basically it creates local variables and function accessible to the haml template.

See [test.js][] for an example usage of Haml.render

## Plugins

There are plugins in the parser for things like inline script tags, css blocks, and experimental support for if statements and for loops.

### If statements

`If` statements evaluate a condition for truthiness (as opposed to a strict comparison to `true`) and includes the content inside the block if it's truthy.

    :if{ condition : todolist.length > 20 }
      %p Oh my, you are a busy fellow!

### Foreach loops

`Foreach` loops allow you to loop over a collection including a block of content once for each item. You need to specify the array you are looping over (`array`) and the name of the variable the item should be put into (`value`).

    %ul.todolist
      :foreach{ array : todolist, value : "item" }
        %li= item.description

## Get Involved

If you want to use this project and something is missing then send me a message.  I'm very busy and have several open source projects I manage.  I'll contribute to this project as I have time, but if there is more interest for some particular aspect, I'll work on it a lot faster.  Also you're welcome to fork this project and send me patches/pull-requests.

## License

Haml-js is [licensed][] under the [MIT license][].

[MIT license]: http://creativecommons.org/licenses/MIT/
[licensed]: http://github.com/creationix/haml-js/blob/master/LICENSE
[jquery-haml]: http://github.com/creationix/jquery-haml
[haml]: http://haml.hamptoncatlin.com/
[test.js]: http://github.com/creationix/haml-js/blob/master/test/test.js
