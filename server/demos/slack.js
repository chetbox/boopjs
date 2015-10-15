function sign_in(team, email, password) {
    tap('Sign in');
    wait(1);

    type_text(team);
    tap('Continue');
    wait(1);

    type_text(email);
    tap('Continue');
    wait(1);

    tap('password');
    wait(1);

    type_text(password);
    wait(1);
    tap('Continue');
    wait(5);
}
function open_conversation(conversation_name) {
    tap('Jump to…');
    wait(1);

    type_text(conversation_name);
    wait(1);

    tap(bottommost(conversation_name));
    wait(3);
}
function send_message(message) {
    tap('Type a message');
    wait(1);

    type_text(message);
    tap({id: 'message_send_btn'});
    hide_keyboard();
    wait(1);
}

sign_in('chetbot', 'chetbot@chetbox.com', 'myweakpassword');
screenshot();

open_conversation('binary-solo');
screenshot();

send_message('Hey! I\'m sending this from the Slack Android app using Chetbot');

assert_visible('Hey! I\'m sending this from the Slack Android app using Chetbot');
