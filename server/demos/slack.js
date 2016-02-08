function sign_in(team, email, password) {
    tap('Sign in');

    wait_for('team domain');
    type_text(team);
    tap('Continue');

    wait_for('Your email address');
    type_text(email);
    tap('Continue');

    tap('password');
    type_text(password);

    tap('Continue');
    wait_for(team);
}
function open_conversation(conversation_name) {
    tap('Jump to…');
    type_text(conversation_name);
    wait_for(function() {
      // Search box + search result
      return count(conversation_name) == 2;
    });
    tap(bottommost(conversation_name));
}
function send_message(message) {
    tap('Type a message');
    type_text(message);
    tap({id: 'message_send_btn'});
    hide_keyboard();
}

sign_in('chetbot', 'chetbot@chetbox.com', 'myweakpassword');
screenshot();

open_conversation('binary-solo');
screenshot();

send_message('Hey! I\'m sending this from the Slack Android app using boop.js');

assert_visible('Hey! I\'m sending this from the Slack Android app using boop.js');
