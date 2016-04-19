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
    if (v.isClickable() || v.isLongClickable()) {
      var original_listener = __get_listener('OnClickListener', v);
      if (original_listener) {
        if (!watch_interactions.click_listener_hashCodes.contains(v.hashCode())) {
          log('Adding click handler to ' + v);
          var new_listener = function (v) {
            original_listener.onClick(v);
            interaction_callback({
              type: 'tap',
              target: v
            });
          };
          v.setOnClickListener(new_listener);
          watch_interactions.click_listener_hashCodes.add(v.hashCode());
        }
      }
    }
    if (v instanceof android.widget.EditText) {
      log('Adding text changed handler to ' + v);
      if (!watch_interactions.text_listener_hashCodes.contains(v.hashCode())) {
        v.addTextChangedListener({
          onTextChanged: function(s, start, before, count) {
            var keys_typed = (count === 0 && before === 1)
              ? '\b'
              : s.toString().substring(start + before, start + count) + '';
            if (keys_typed) {
              interaction_callback({
                type: 'press',
                target: v,
                keys: keys_typed
              });
            }
          }
        });
        watch_interactions.text_listener_hashCodes.add(v.hashCode());
      }
    }
    if (v instanceof android.support.v4.widget.DrawerLayout) {
      log('Adding drawer listener to ' + v);
      if (!watch_interactions.text_listener_hashCodes.contains(v.hashCode())) {
        var original_listener = v.addDrawerListener /* => new API */
          ? undefined
          : __get_listener('Listener', v);
        var new_listener = {
          onDrawerClosed: function(drawerContentView) {
            if (original_listener) original_listener.onDrawerClosed(v);
            interaction_callback({
              type: 'drawer',
              target: v,
              action: 'close'
            });
          },
          onDrawerOpened: function(drawerContentView) {
            if (original_listener) original_listener.onDrawerOpened(v);
            interaction_callback({
              type: 'drawer',
              target: v,
              action: 'open'
            });
          },
          onDrawerSlide: function(drawerContentView, slideOffset) {
            if (original_listener) original_listener.onDrawerSlide(v);
          },
          onDrawerStateChanged: function(state) {
            if (original_listener) original_listener.onDrawerStateChanged(state);
          },
        };
        if (v.addDrawerListener) {
          v.addDrawerListener(new_listener);
        } else {
          v.setDrawerListener(new_listener);
        }
      }
      watch_interactions.text_listener_hashCodes.add(v.hashCode());
    }
    return false; // Do not match => Continue traversing hierarchy
  });
}
watch_interactions.click_listener_hashCodes = new java.util.HashSet();
watch_interactions.text_listener_hashCodes = new java.util.HashSet();

function wait_for_interaction() {
  var container = __container();
  watch_interactions(function(interaction) {
    container.set_content(interaction);
  });
  return container.wait_for_content();
}

function start_recorder(callback) {
  if (!callback) {
    throw new Error('Callback not specified');
  }
  var layout_changes = 0;
  var root = content_view();
  log('Adding GlobalLayoutListener to ' + root);
  root.getViewTreeObserver().addOnGlobalLayoutListener(function() {
    layout_changes++;
    watch_interactions(callback);
  });
  watch_interactions(callback);
}
