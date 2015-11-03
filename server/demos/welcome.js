// Here are a few examples to get you started.
//
// Use the links above for the full JavaScript API docs or to get in touch if
// you need help.

// Find the view with the text "Apple"
view('Apple');
// which is equivalent to
view({text: 'Apple'});
// or
views({text: 'Apple'})[0];

// Tap on an element with the text "Banana"
tap('Banana');
// or
tap(view('Banana'));

// Long-press on an element with the ID "cherry"
tap({id: 'cherry'}, {duration: 1});
// You can also use the fully-qualified ID
tap({id: 'com.example:id/cherry'}, {duration: 1});

// Check that "Elderberry" is displayed on the screen
assert_visible('Damson');
// or
assert_visible(view('Damson'));

// Wait three seconds for "Elderberry" to appear on the screen
wait_for('Elderberry', {timeout: 3});
// or
wait_for(function(){ return view('Elderberry'); }, {timeout: 3});

// Ensure the text of the button closest to the label "Fig" is "Buy now"
assert_equal(text(views({type: 'Button'})
                  .closest_to('Fig')),
             'Buy now');

// For more detailed information and examples please refer to the API
// documentation using the link above, or get in touch for further support.
