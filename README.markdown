# haml-js

What's left in this project is the server-side haml language.  It has much of the same functionality as the traditional haml. Syntax based on [haml][] from the ruby world.

## NOTE, Project was split

If you're looking for the old haml-js (It was a jQuery plugin that made dom-building easy using a haml like syntax), it's now renamed to [jquery-haml][]

## Sample usage

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

...More to come...


[jquery-haml]: http://github.com/creationix/jquery-haml
[haml]: http://haml.hamptoncatlin.com/