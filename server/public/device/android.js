var version = '0.7.0';

// Import android.*

var android = Packages.android;

// Utilities

function __container() {
  var latch = new java.util.concurrent.CountDownLatch(1);
  var content;
  return {
    set_content: function(value) {
      content = value;
      latch.countDown();
    },
    wait_for_content: function() {
      latch.await();
      return content;
    },
    content: function() {
      return content;
    }
  };
}

// Console

var console = {
  log: function(message) {
    Packages.android.util.Log.i('CHETBOT', message.toString());
  }
};

// Activities

var __activityThreadClass = java.lang.Class.forName('android.app.ActivityThread');
var __activityThread__activitiesField = __activityThreadClass.getDeclaredField('mActivities');
__activityThread__activitiesField.setAccessible(true);
var __activityRecordClass = java.lang.Class.forName('android.app.ActivityThread$ActivityClientRecord');
var __activityRecord_pausedField = __activityRecordClass.getDeclaredField('paused');
__activityRecord_pausedField.setAccessible(true);
var __activityRecord_activityField = __activityRecordClass.getDeclaredField('activity');
__activityRecord_activityField.setAccessible(true);

function _activity() {
  var activityThread = __activityThreadClass.getMethod('currentActivityThread').invoke(null);
  var activities = __activityThread__activitiesField.get(activityThread);
  // TODO: handle API < 19 (ArrayMap is new for API 19)
  for (var i=activities.values().iterator(); i.hasNext();) {
    var activityRecord = i.next();
    console.log('' + activityRecord);
    if (!__activityRecord_pausedField.getBoolean(activityRecord)) {
      var activity = __activityRecord_activityField.get(activityRecord);
      console.log(activity.getPackageName() + ' ? ' + package_name); // package_name is defined globally
      if (activity.getPackageName().equals(package_name)) {
        return activity;
      } else {
        console.log('Found activity for different package: ' + activity.getPackageName());
      }
    }
  }
}

function activity() {
  var tryCount = 0;
  while (true) {
    try {
      return _activity();
    } catch (e) {
      if (e.javaException instanceof android.content.ActivityNotFoundException) {
        tryCount++;
        if (tryCount >= 5) {
          throw e;
        }
      } else {
        throw e;
      }
    }
    java.lang.Thread.sleep(50);
  }
}

function run_on_ui_thread(fn) {
  var current_activity = activity();
  current_activity.runOnUiThread(function() {
    fn(current_activity);
  });
}

var __classLoader = java.lang.Thread.currentThread().getContextClassLoader();
var __rootsOracleClass = java.lang.Class.forName('android.support.test.espresso.base.RootsOracle', true, __classLoader);
var __rootsOracleConstructor = __rootsOracleClass.getDeclaredConstructor([android.os.Looper]);
__rootsOracleConstructor.setAccessible(true);
var __rootsOracle = __rootsOracleConstructor.newInstance(android.os.Looper.getMainLooper());
var __rootViewPickerClass = java.lang.Class.forName('android.support.test.espresso.base.RootViewPicker', true, __classLoader);
var __rootViewPicker_reduceRoots = __rootViewPickerClass.getDeclaredMethod('reduceRoots', java.util.List);
__rootViewPicker_reduceRoots.setAccessible(true);
var __rootViewPicker = android.support.test.espresso.base.RootViewPicker_Factory.create(
  function() { return null; },
  function() { return null; },
  function() { return android.support.test.runner.lifecycle.ActivityLifecycleMonitorRegistry.getInstance(); },
  function() { return new java.util.concurrent.atomic.AtomicReference(android.support.test.espresso.matcher.RootMatchers.DEFAULT); }
).get();

function content_view() {
  function list_active_roots() {
    return __rootsOracle.listActiveRoots().toArray();
  }
  function apply_default_root_matcher(roots) {
    return roots.filter(function(root) {
      return android.support.test.espresso.matcher.RootMatchers.DEFAULT.matches(root)
    });
  }
  function reduce_roots(roots) {
    return __rootViewPicker_reduceRoots.invoke(__rootViewPicker, java.util.Arrays.asList(roots));
  }
  function find_content_view(root_view) {
    return root_view.findViewById(android.R.id.content);
  }
  var root_view_container = __container();
  run_on_ui_thread(function() {
    root_view_container.set_content(reduce_roots(apply_default_root_matcher(list_active_roots())).getDecorView());
  });
  return find_content_view(root_view_container.wait_for_content());
}

// Wait

function wait(seconds) {
  java.lang.Thread.sleep(seconds * 1000);
}

// TODO: define visible
function wait_for(selector, options) {
  var timeout = (options && options.timeout) || 60;
  var start = android.os.SystemClock.uptimeMillis();
  while (!visible(selector)) {
    if ((android.os.SystemClock.uptimeMillis() - start) > (timeout * 1000)) {
      throw 'Timeout expired';
    } else {
      java.lang.Thread.sleep(50);
    }
  }
}

// Drawers

function open_drawer(which) {
  which = which || 'START';
  activity().runOnUiThread(function() {
    view({type: 'DrawerLayout'}).openDrawer(android.support.v4.view.GravityCompat[which.toUpperCase()]);
  });
  java.lang.Thread.sleep(0.75 * 1000);
}

function close_drawer(which) {
  which = which || 'START';
  activity().runOnUiThread(function() {
    view({type: 'DrawerLayout'}).closeDrawer(android.support.v4.view.GravityCompat[which.toUpperCase()]);
  });
  java.lang.Thread.sleep(0.75 * 1000);
}

// Assertions

function assert_true(o) {
  if (!o) { throw (o + ' is not truthy'); }
}

function assert_false(o) {
  if (o) { throw (o + ' is truthy'); }
}

function assert_equal(a, b) {
  if (a != b) { throw (a + ' != ' + b); }
}

// TODO: define visible
function assert_visible(selector) {
  assert_true(visible(selector));
}

// Interaction - h/w keys

function press(key) {
  switch (typeof(key)) {
    case 'string':
      switch (key) {
        case 'home':
          var homeIntent = new android.content.Intent(android.content.Intent.ACTION_MAIN);
          homeIntent.addCategory(android.content.Intent.CATEGORY_HOME);
          homeIntent.setFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
          activity().startActivity(homeIntent);
          java.lang.Thread.sleep(500);
          break;
        case 'back':
          press(android.view.KeyEvent.KEYCODE_BACK);
          break;
        case 'enter':
        case 'return':
        case '\n':
          press(android.view.KeyEvent.KEYCODE_ENTER);
          break;
        case 'backspace':
        case '\b':
          press(android.view.KeyEvent.KEYCODE_DEL);
          break;
        default:
          throw 'Unrecognised key: ' + key;
      }
      break;
    case 'number':
      // TODO: on topmost window (e.g. for AlertDialogs)
      run_on_ui_thread(function(activity) {
        activity.dispatchKeyEvent(new android.view.KeyEvent(android.view.KeyEvent.ACTION_DOWN, key));
        activity.dispatchKeyEvent(new android.view.KeyEvent(android.view.KeyEvent.ACTION_UP, key));
      });
      java.lang.Thread.sleep(250);
      break;
    default:
      throw 'Invalid key type: ' + typeof(key);
  }
}

// Interaction - typing

function type_text(text) {
  run_on_ui_thread(function(activity) {
    activity.dispatchKeyEvent(new android.view.KeyEvent(android.os.SystemClock.uptimeMillis(), text.toString(), 0, 0));
  });
}

function hide_keyboard() {
  var input_method_manager = activity().getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
  input_method_manager.hideSoftInputFromWindow(content_view().getWindowToken(), 0);
  java.lang.Thread.sleep(250);
}

// Debugging tools

function toast(message) {
  run_on_ui_thread(function(activity) {
    android.widget.Toast.makeText(activity, message.toString(), 0).show();
  });
}

function crash() {
  run_on_ui_thread(function() {
    throw 'Forced crash';
  });
}

// Screenshots

function screenshot() {
  var screenshot_container = __container();
  run_on_ui_thread(function(activity) {
    var decor_view = activity.getWindow().getDecorView();
    decor_view.destroyDrawingCache();
    decor_view.setDrawingCacheEnabled(true);
    try {
      var screenshot = decor_view.getDrawingCache();
      screenshot_container.set_content(screenshot.copy(screenshot.getConfig(), false));
    } finally {
      decor_view.setDrawingCacheEnabled(false);
    }
  });
  return screenshot_container.wait_for_content();
}
