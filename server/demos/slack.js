// Sign in
tap('Sign in');
wait_for('team domain');
type_text('chetbot');
tap('Continue');
wait_for('Your email address');
type_text('chetbot@chetbox.com');
tap('Continue');
tap('password');
type_text('myweakpassword');
tap('Continue');
wait_for('chetbot');

screenshot();

// Open a conversation
var conversation_name = 'binary-solo';
tap({has_text: 'Jump to'});
wait(2);
type_text(conversation_name);
wait_for(function() {
  // Search box + search result
  return count(conversation_name) === 2;
});
tap(bottommost(conversation_name));

screenshot();

// Send a message
tap('Type a message');
type_text("Hey! I'm sending this from the Slack Android app using boop.js");
tap({id: 'message_send_btn'});
hide_keyboard();

assert_visible("Hey! I'm sending this from the Slack Android app using boop.js");
