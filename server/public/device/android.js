var version = [0, 7, 0];

// Import android.*

var android = Packages.android;

// Java interop magic

var __classLoader = java.lang.Thread.currentThread().getContextClassLoader();

// Concurrency utilities

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

function __latch(count) {
  var latch = new java.util.concurrent.CountDownLatch(count || 1);
  return {
    signal: function(value) {
      latch.countDown();
    },
    wait: function() {
      latch.await();
    }
  };
}

// Console

var console = {
  log: function(message) {
    Packages.android.util.Log.i('Chetbot', message + '');
    return message;
  }
};

// Activities

function screen_size() {
  var display = activity().getWindowManager().getDefaultDisplay();
  var size = new android.graphics.Point();
  display.getSize(size);
  return [size.x, size.y];
}

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
    if (!__activityRecord_pausedField.getBoolean(activityRecord)) {
      var activity = __activityRecord_activityField.get(activityRecord);
      if (activity.getPackageName().equals(package_name)) { // package_name is defined globally
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

// View selectors

function __text(view) {
  return (view instanceof android.widget.TextView)
      && (!android.text.TextUtils.isEmpty(view.getText())
          ? view.getText().toString()
          : (!android.text.TextUtils.isEmpty(view.getHint())
              ? view.getHint().toString()
              : null));
}

function __id(view) {
  var id = view.getId();
  return (id > 0) ? view.getResources().getResourceName(id) : null;
}

function __type(view) {
  return view.getClass().getName();
}

function __location(view) {
  var xy = java.lang.reflect.Array.newInstance(java.lang.Integer.TYPE, 2);
  view.getLocationOnScreen(xy);
  return [xy[0], xy[1]];
}

function __size(view) {
  return [view.getWidth(), view.getHeight()];
}

function __center(view) {
  var xy = __location(view);
  return [xy[0] + view.getWidth() / 2, xy[1] + view.getHeight() / 2];
}

function views(selectors, root_views) {

  function visible_matcher(screen_size) {
    return function(view) {
      var location = __location(view),
          size = __size(view),
          left = location[0],
          right = location[0] + size[0],
          top = location[1],
          bottom = location[1] + size[1];
      return view.getVisibility() === android.view.View.VISIBLE
          && left < screen_size[0]
          && right >= 0
          && top < screen_size[1]
          && bottom >= 0;
    }
  }

  function text_matcher(text_query) {
    return function(view) {
      return text_query.equalsIgnoreCase(__text(view));
    }
  }

  function type_matcher(type) {
    return function(view) {
      return type.equalsIgnoreCase( type.indexOf('.') >= 0
        ? __type(view)
        : view.getClass().getSimpleName());
    }
  }

  function id_matcher(id_query) {
    return function(view) {
      var id_string = __id(view);
      return id_string
          && (id_query.indexOf('/') >= 0
              ? id_string.equalsIgnoreCase(id_query)
              : id_string.endsWith('/' + id_query));
    }
  }

  function children(view) {
    var visible_children = [];
    if (view instanceof android.view.ViewGroup) {
      for (var i=0; i<view.getChildCount(); i++) {
        var child = view.getChildAt(i);
        if (child.getVisibility() === android.view.View.VISIBLE) {
          visible_children.push(child);
        }
      }
    }
    return visible_children;
  }

  function find_matching_views(views, match_fn) {
    return views.reduce(function(views, view) {
      return views.concat(
        match_fn(view) ? [view] : find_matching_views(children(view), match_fn)
      );
    }, []);
  }

  function make_selector_fn(selector) {
    switch (typeof(selector)) {
      case 'function':
        return selector;
      case 'string':
        return make_selector_fn({text: selector});
      case 'object':
        if (selector instanceof android.view.View) {
          return function(v) { return v === selector; };
        } else {
          if (!selector.text && !selector.type && !selector.id) {
            throw '"text", "type" or "id" must be specified';
          }
          var match_any = function() { return true; },
              match_visible = visible_matcher(screen_size()),
              match_text = selector.text ? text_matcher(selector.text) : match_any,
              match_type = selector.type ? type_matcher(selector.type) : match_any,
              match_id   = selector.id   ? id_matcher(selector.id)     : match_any;
          return function(v) { return match_visible(v) && match_text(v) && match_type(v) && match_id(v) };
        }
      default:
        throw 'View selector must be a string, object, function or View';
    }
  }

  if (selectors === undefined) {
    throw 'No view selector specified';
  }

  if (!Array.isArray(selectors)) {
    return views([selectors], root_views);
  }

  if (selectors[0] instanceof android.view.View) {
    // Assume we've been passed a list of Views so just return them
    return selectors;
  }

  if (root_views === undefined) {
    return views(selectors, children(content_view()));
  }

  return selectors.length === 0
    ? root_views
    : views(
        selectors.slice(1),
        find_matching_views(root_views, make_selector_fn(selectors[0]))
      );
}

function count(selector) {
  return views(selector).length;
}

function visible(selector) {
  return count(selector) > 0;
}

function view(selector) {
  return views(selector)[0];
}

function text(selector) {
  return __text(view(selector));
}

function id(selector) {
  return __id(view(selector));
}

function type(selector) {
  return __type(view(selector));
}

function location(selector) {
  return __location(view(selector));
}

function size(selector) {
  return __size(view(selector));
}

function center(selector) {
  return __center(view(selector));
}

function leftmost(selector) {
  return views(selector).sort(function(v1, v2) {
    return __center(v1)[0] - __center(v2)[0];
  })[0];
}

function rightmost(selector) {
  return views(selector).sort(function(v1, v2) {
    return __center(v2)[0] - __center(v1)[0];
  })[0];
}

function topmost(selector) {
  return views(selector).sort(function(v1, v2) {
    return __center(v1)[1] - __center(v2)[1];
  })[0];
}

function bottommost(selector) {
  return views(selector).sort(function(v1, v2) {
    return __center(v2)[1] - __center(v1)[1];
  })[0];
}

function distance_to_point(view, point) {
  var view_center = __center(view),
      dx = view_center[0] - point[0],
      dy = view_center[1] - point[1];
  return dx * dx + dy * dy;
}

function centermost(selector) {
  var screen_center = screen_size().map(function(px) { return px / 2; });
  return views(selector).sort(function(v1, v2) {
    return distance_to_point(v1, screen_center) - distance_to_point(v2, screen_center);
  })[0];
}

function outermost(selector) {
  var screen_center = screen_size().map(function(px) { return px / 2; });
  return views(selector).sort(function(v1, v2) {
    return distance_to_point(v2, screen_center) - distance_to_point(v1, screen_center);
  })[0];
}

function all_ids(selector) {
  var ids = [];
  views(
    function(v) {
      var id = __id(v);
      if (id) ids.push(id);
      return false; // keep searching
    },
    selector ? views(selector) : undefined);
  return ids;
}

// View array filters

Array.prototype.closest_to = function(v) {
  var view_center = Array.isArray(v) ? v : center(v);
  return this.sort(function(v1, v2) {
    return distance_to_point(v1, view_center) - distance_to_point(v2, view_center);
  })[0];
}

Array.prototype.furthest_from = function(v) {
  var view_center = Array.isArray(v) ? v : center(v);
  return this.sort(function(v1, v2) {
    return distance_to_point(v2, view_center) - distance_to_point(v1, view_center);
  })[0];
}

// Wait

function wait(seconds) {
  java.lang.Thread.sleep(seconds * 1000);
}

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

function assert_visible(selector) {
  assert_true(visible(selector));
}

// Interaction - touch

var __inputManagerEventInjectionStrategyClass = java.lang.Class.forName('android.support.test.espresso.base.InputManagerEventInjectionStrategy', true, __classLoader);
var __inputManagerEventInjectionStrategy_constructor = __inputManagerEventInjectionStrategyClass.getDeclaredConstructor([]);
__inputManagerEventInjectionStrategy_constructor.setAccessible(true);
var __inputManagerEventInjectStrategy_initialize = __inputManagerEventInjectionStrategyClass.getDeclaredMethod('initialize');
__inputManagerEventInjectStrategy_initialize.setAccessible(true);
var __inputManagerEventInjectionStrategy_injectMotionEvent = __inputManagerEventInjectionStrategyClass.getMethod('injectMotionEvent', android.view.MotionEvent);
var __inputManagerEventInjectionStrategy = __inputManagerEventInjectionStrategy_constructor.newInstance();
__inputManagerEventInjectStrategy_initialize.invoke(__inputManagerEventInjectionStrategy);

function __inject_motion_event() {
  for (var i=0; i<arguments.length; i++) {
    __inputManagerEventInjectionStrategy_injectMotionEvent.invoke(__inputManagerEventInjectionStrategy, arguments[i]);
  }
}

function tap(selector, options) {
  if (!options) options = {};
  if (options.duration === undefined) options.duration = 0.02;

  var view_center = center(selector);
  var timestamp = android.os.SystemClock.uptimeMillis();
  __inject_motion_event(
    android.view.MotionEvent.obtain(
      timestamp,
      timestamp,
      android.view.MotionEvent.ACTION_DOWN,
      view_center[0],
      view_center[1],
      0
    ),
    android.view.MotionEvent.obtain(
      timestamp,
      timestamp + options.duration * 1000,
      android.view.MotionEvent.ACTION_UP,
      view_center[0],
      view_center[1],
      0
    )
  );
  java.lang.Thread.sleep(250);
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
  var key_event = new android.view.KeyEvent(android.os.SystemClock.uptimeMillis(), text.toString(), 0, 0);
  var done = __latch();
  run_on_ui_thread(function(activity) {
    activity.dispatchKeyEvent(key_event);
    done.signal();
  });
  done.wait();
}

function hide_keyboard() {
  var input_method_manager = activity().getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
  input_method_manager.hideSoftInputFromWindow(content_view().getWindowToken(), 0);
  java.lang.Thread.sleep(250);
}

// Debugging tools

function toast(message) {
  run_on_ui_thread(function(activity) {
    android.widget.Toast.makeText(activity, message + '', 0).show();
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
