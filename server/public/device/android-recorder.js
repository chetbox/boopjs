var TAG = 'Chetbot-recorder';
function log(s) {
  Packages.android.util.Log.d(TAG, s + '');
}

var android_view_View_mListenerInfo_field = java.lang.Class.forName('android.view.View').getDeclaredField('mListenerInfo');
android_view_View_mListenerInfo_field.setAccessible(true);

function __get_listener(listener_name, view) {
  var listener_info = android_view_View_mListenerInfo_field.get(view);
  if (listener_info) {
    return listener_info['m' + listener_name];
  }
}

function watch_interactions(interaction_callback) {
  views(function(v) {
    if (v.isClickable()) {
      var original_listener = __get_listener('OnClickListener', v);
      if (original_listener) {
        if (!watch_interactions.listener_hashCodes.hashCode()) {
          log('Adding click handler to ' + v);
          var new_listener = new android.view.View.OnClickListener(function (v) {
            original_listener.onClick(v);
            interaction_callback({
              type: 'tap',
              target: v
            });
          });
          v.setOnClickListener(new_listener);
          watch_interactions.listener_hashCodes.add(new_listener.hashCode());
        }
      } else {
        log('warning: no click handler found: ' + v);
      }
    }
    return false; // Do not match => Continue traversing hierarchy
  });
}
watch_interactions.listener_hashCodes = new java.util.HashSet();

function wait_for_interaction() {
  var container = __container();
  watch_interactions(function(interaction) {
    container.set_content(interaction);
  });
  return container.wait_for_content();
}
