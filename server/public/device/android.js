var version = [0, 7, 7];

// Import android.*

var android = Packages.android;

// RegExp utilities

RegExp.escape = function(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

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
    wait: function(options) {
      var timeout = (options && options.timeout) || 10;
      if (!latch.await(timeout * 1000, java.util.concurrent.TimeUnit.MILLISECONDS)) {
        throw 'Timed out after ' + timeout + 's' ;
      }
    }
  };
}

function run_on_ui_thread(fn) {
  var current_activity = activity();
  current_activity.runOnUiThread(function() {
    fn(current_activity);
  });
}

// Device info

function screen_size() {
  var display = activity().getWindowManager().getDefaultDisplay();
  var size = new android.graphics.Point();
  display.getSize(size);
  return [size.x, size.y];
}

// View selectors

function __text(view) {
  function to_string(char_seq) {
    if (char_seq) return char_seq.toString();
  }
  if (view instanceof android.widget.TextView) {
    return !android.text.TextUtils.isEmpty(view.getText())
      ? to_string(view.getText())
      : to_string(view.getHint());
  }
  if (view instanceof android.support.design.widget.TextInputLayout) {
    return view.getHint().toString();
  }
}

function __id(view) {
  var id = view.getId();
  return (id > 0) ? view.getResources().getResourceName(id) : null;
}

function __type(view) {
  return view.getClass().getName();
}

function __type_hierarchy(class) {
  return [class].concat(
    (class === android.view.View)
      ? []
      : __type_hierarchy(class.superclass)
    );
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
      var text = __text(view);
      if (!text) {
        return false;
      }
      if (text_query instanceof RegExp) {
        return !!text.match(text_query);
      }
      if (typeof(text_query) === 'string') {
        return text.equalsIgnoreCase(text_query);
      }
      throw new Error('Invalid text selector: ' + text_query);
    }
  }

  function has_text_matcher(has_text_query) {
    if (typeof(has_text_query) !== 'string') {
      throw new Error('has_text expects a string');
    }
    return text_matcher(new RegExp('\\b' + RegExp.escape(has_text_query) + '\\b', 'i'));
  }

  function type_matcher(type) {

    return function(view) {
      if (typeof(type) === 'string') {
        return __type_hierarchy(view.getClass()).reduce(function(matches_class, cls) {
          return matches_class ||
            (type.equalsIgnoreCase( type.indexOf('.') >= 0
              ? cls.getName()
              : cls.getSimpleName()));
        }, false);
      } else {
        return view instanceof type;
      }
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
        if (selector instanceof RegExp) {
          return make_selector_fn({text: selector});
        } else if (selector instanceof android.view.View) {
          return function(v) { return v === selector; };
        } else {
          if (!selector.text && !selector.has_text && !selector.type && !selector.id) {
            throw '"text", "has_text", "type" or "id" must be specified';
          }
          var match_any = function() { return true; },
              match_visible = visible_matcher(screen_size()),
              match_text      = selector.text     ? text_matcher(selector.text)         : match_any,
              match_has_text  = selector.has_text ? has_text_matcher(selector.has_text) : match_any,
              match_type      = selector.type     ? type_matcher(selector.type)         : match_any,
              match_id        = selector.id       ? id_matcher(selector.id)             : match_any;
          return function(v) {
            return match_visible(v) && match_text(v) && match_has_text(v) && match_type(v) && match_id(v);
          };
        }
      default:
        throw 'View selector must be a string, RegExp, object, function or View';
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
  return __id(wait_for(selector));
}

function type(selector) {
  return __type(wait_for(selector));
}

function location(selector) {
  if (Array.isArray(selector) &&
      selector.length === 2 &&
      typeof(selector[0]) === 'number' &&
      typeof(selector[1]) === 'number') {

      return selector;
  }
  return __location(wait_for(selector));
}

function size(selector) {
  if (Array.isArray(selector) &&
      selector.length === 2 &&
      typeof(selector[0]) === 'number' &&
      typeof(selector[1]) === 'number') {

      return selector;
  }
  return __size(wait_for(selector));
}

function center(selector) {
  if (Array.isArray(selector) &&
      selector.length === 2 &&
      typeof(selector[0]) === 'number' &&
      typeof(selector[1]) === 'number') {

      return selector;
  }
  return __center(wait_for(selector));
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
    selector ? views(selector) : undefined
  );
  return ids;
}

function all_text(selector) {
  var strings = [];
  views(
    function(v) {
      var str = __text(v);
      if (str) strings.push(str);
      return false; // keep searching
    },
    selector ? views(selector) : undefined
  );
  return strings;
}

function all_types(selector) {
  var types = new java.util.HashSet();
  views(
    function(v) {
      types.addAll(__type_hierarchy(v.getClass()).map(function(class) {
        return class.getName();
      }));
      return false; // keep searching
    },
    selector ? views(selector) : undefined
  );
  return types;
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

function wait_for(wait_for_fn, options) {
  var timeout = (options && options.timeout) || 10;
  var start = android.os.SystemClock.uptimeMillis();
  if (typeof(wait_for_fn) !== 'function') {
    var selector = wait_for_fn;
    wait_for_fn = function() {
      return view(selector);
    }
  }
  var success = false;
  while (!success) {
    success = wait_for_fn();
    if ((android.os.SystemClock.uptimeMillis() - start) > (timeout * 1000)) {
      throw 'Timeout expired (' + timeout + 's)';
    } else {
      java.lang.Thread.sleep(50);
    }
  }
  return success;
}

// Drawers

function open_drawer(which, options) {
  which = which || 'START';
  var drawer_layout = wait_for({type: 'DrawerLayout'});
  run_on_ui_thread(function() {
    drawer_layout.openDrawer(android.support.v4.view.GravityCompat[which.toUpperCase()]);
  });
  java.lang.Thread.sleep(0.75 * 1000);
}

function close_drawer(which, options) {
  which = which || 'START';
  var drawer_layout = wait_for({type: 'DrawerLayout'});
  run_on_ui_thread(function() {
    drawer_layout.closeDrawer(android.support.v4.view.GravityCompat[which.toUpperCase()]);
  });
  java.lang.Thread.sleep(0.75 * 1000);
}

// Assertions

function assert_true(o) {
  if (!o) {
    throw JSON.stringify(o) + ' is not truthy';
  }
}

function assert_false(o) {
  if (o) {
    throw JSON.stringify(o) + ' is not falsey';
  }
}

function assert_equal(a, b) {
  if (a != b) {
    throw JSON.stringify(a) + ' is not ' + JSON.stringify(b);
  }
}

function assert_visible(selector) {
  if (!visible(selector)) {
    throw selector + ' not visible';
  }
}

// Interaction - touch

function __touch(location, duration_ms, move_fn) {
  var timestamp = android.os.SystemClock.uptimeMillis();
  var offset = move_fn ? move_fn(0.0) : [0, 0];

  inject_motion_event(
    android.view.MotionEvent.obtain(
      timestamp,
      timestamp,
      android.view.MotionEvent.ACTION_DOWN,
      location[0] + offset[0],
      location[1] + offset[1],
      0
    )
  );

  if (move_fn) {
    for (var t=0; t<duration_ms; t+=10) {
      var offset = move_fn(t / duration_ms);
      inject_motion_event(
        android.view.MotionEvent.obtain(
          timestamp,
          timestamp + t,
          android.view.MotionEvent.ACTION_MOVE,
          location[0] + offset[0],
          location[1] + offset[1],
          0
        )
      );
    }
  }

  offset = move_fn ? move_fn(1.0) : [0, 0];
  inject_motion_event(
    android.view.MotionEvent.obtain(
      timestamp,
      timestamp + duration_ms,
      android.view.MotionEvent.ACTION_UP,
      location[0] + offset[0],
      location[1] + offset[1],
      0
    )
  );
}

function tap(selector, options) {
    if (!options) options = {};
    if (options.duration === undefined) options.duration = 0.02;
    __touch(center(selector), options.duration * 1000);
    java.lang.Thread.sleep(100);
}

function __swipe(move_fn_provider, selector, options) {
  if (!options) options = {};
  if (options.duration === undefined) options.duration = 0.2;
  if (options.distance === undefined) options.distance = 2.54; // cm

  var display_metrics = new android.util.DisplayMetrics();
  activity().getWindowManager().getDefaultDisplay().getMetrics(display_metrics);
  var distance_pixels = options.distance * display_metrics.xdpi / 2.54;

  __touch(
    center(selector || content_view()),
    options.duration * 1000,
    move_fn_provider(distance_pixels)
  );
  java.lang.Thread.sleep(250);
}

function swipe_right(selector, options) {
  __swipe(function(dx) {
    return function(t) {
      return [dx * Math.pow(t, 3), 0];
    };
  }, selector, options);
}

function swipe_left(selector, options) {
  __swipe(function(dx) {
    return function(t) {
      return [dx * Math.pow(t, 3) * -1, 0];
    };
  }, selector, options);
}

function swipe_up(selector, options) {
  __swipe(function(dy) {
    return function(t) {
      return [0, dy * Math.pow(t, 3) * -1];
    };
  }, selector, options);
}

function swipe_down(selector, options) {
  __swipe(function(dy) {
    return function(t) {
      return [0, dy * Math.pow(t, 3)];
    };
  }, selector, options);
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
  wait_for(function() {
    return activity().getCurrentFocus();
  });

  var keyCharacterMap = android.view.KeyCharacterMap.load(android.view.KeyCharacterMap.VIRTUAL_KEYBOARD),
      events = keyCharacterMap.getEvents(new java.lang.String(text.toString()).toCharArray());

  events.forEach(function(event) {
    inject_key_event(event);
  });

  java.lang.Thread.sleep(100);
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

function screenshot(selector) {
  var screenshot_container = __container();
  var current_activity = activity();
  var v = selector ? view(selector) : current_activity.getWindow().getDecorView();
  current_activity.runOnUiThread(function() {
    v.destroyDrawingCache();
    v.setDrawingCacheEnabled(true);
    try {
      var screenshot = v.getDrawingCache();
      screenshot_container.set_content(screenshot
        ? screenshot.copy(screenshot.getConfig(), false)
        : null
      );
    } finally {
      v.setDrawingCacheEnabled(false);
    }
  });
  return screenshot_container.wait_for_content();
}

// IPC

function open_uri(uri) {
  var intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
  intent.setData(android.net.Uri.parse(uri));
  activity().startActivity(intent);
}

// WebViews

function in_webview(selector, fn, options) {
  if (arguments.length === 1) {
    // Shorthand
    return in_webview({type: 'WebView'}, arguments[0]);
  }
  options = options || {};
  var script = '(' + fn + ')()';

  var v = wait_for(selector, options);
  if (!v) throw 'WebView not found';
  if (!(v instanceof android.webkit.WebView)) throw v + ' is not a WebView';

  var return_value = __container();
  run_on_ui_thread(function() {
    v.getSettings().setJavaScriptEnabled(true);
    v.evaluateJavascript(script, function(value) {
      return_value.set_content(value);
    });
  });
  java.lang.Thread.sleep(100);
  return return_value.wait_for_content();
}
