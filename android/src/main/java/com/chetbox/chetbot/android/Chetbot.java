package com.chetbox.chetbot.android;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;
import android.text.TextUtils;
import android.util.ArrayMap;
import android.util.Log;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.TextView;
import android.widget.Toast;

import org.mozilla.javascript.Callable;
import org.mozilla.javascript.CompilerEnvirons;
import org.mozilla.javascript.ErrorReporter;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Node;
import org.mozilla.javascript.Parser;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.ScriptOrFnNode;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import java.lang.reflect.Field;

import static com.chetbox.chetbot.android.ViewUtils.*;

import static com.google.common.collect.Iterables.*;
import static com.google.common.collect.Lists.*;

public class Chetbot implements ChetbotServerConnection.ScriptHandler {

    private static final String TAG = Chetbot.class.getSimpleName();

    private static Chetbot sInstance = null;

    private final String mPackageName;
    private ChetbotServerConnection mServerConnection = null;

    private org.mozilla.javascript.Context mJsContext;
    private Scriptable mJsScope;

    private Chetbot(Activity activity) {
        mPackageName = activity.getPackageName();
    }

    private void connect(Activity activity) {
        String server = activity.getIntent().getStringExtra("chetbot.server");
        String deviceId = activity.getIntent().getStringExtra("chetbot.device");
        boolean quiet = !TextUtils.isEmpty( activity.getIntent().getStringExtra("chetbot.quiet") );

        // Connect to Chetbot server
        if (!TextUtils.isEmpty(server) && !TextUtils.isEmpty(deviceId)) {
            Log.d(TAG, "Starting ChetBot (" + deviceId + ")");
            if (!quiet) {
                Toast.makeText(activity, "Starting ChetBot", Toast.LENGTH_SHORT).show();
            }
            mServerConnection = new ChetbotServerConnection(server, deviceId, this);
        }
    }

    private static SubViews subViewsSelector(Object selector, Scriptable scope) {
        if (selector instanceof String) {
            return new SubViews((String) selector, null, null);
        }

        return new SubViews(
                (String) ((Scriptable) selector).get("text", scope),
                (String) ((Scriptable) selector).get("type", scope),
                (String) ((Scriptable) selector).get("id", scope));
    }

    private static Iterable<View> selectViews(View srcView, Object[] args, Scriptable scope) {
        Iterable<View> views = newArrayList(srcView);
        for (Object arg : args) {
            views = concat(transform(views, subViewsSelector(arg, scope)));
        }
        return views;
    }

    public void onStartScript() {
        // Set up JavaScript environment
        mJsContext = org.mozilla.javascript.Context.enter();
        mJsContext.setOptimizationLevel(-1);
        ScriptableObject scope = mJsContext.initStandardObjects();

        registerJsViewFunction(scope, "get_id", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                View v = firstView(selectedViews);
                int id = v.getId();
                return id != -1
                        ? v.getResources().getResourceName(id)
                        : null;
            }
        });
        registerJsViewFunction(scope, "class_of", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return firstView(selectedViews).getClass().getSimpleName();
            }
        });
        registerJsViewFunction(scope, "count", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return size(selectedViews);
            }
        });
        registerJsViewFunction(scope, "exists", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return !isEmpty(selectedViews);
            }
        });
        registerJsViewFunction(scope, "text", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return ((TextView) firstView(selectedViews)).getText().toString();
            }
        });
        registerJsViewFunction(scope, "location", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return location(firstView(selectedViews));
            }
        });
        registerJsViewFunction(scope, "center", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return center(firstView(selectedViews));
            }
        });
        registerJsViewFunction(scope, "size", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                return size(firstView(selectedViews));
            }
        });
        registerJsFunction(scope, "screenshot", new JsFunction() {
            @Override
            public Object call(Activity activity, Object[] args) {
                return screenshot(activity);
            }
        });
        registerJsViewFunction(scope, "tap", new JsViewFunction() {
            @Override
            public Object call(Activity activity, Iterable<View> selectedViews) {
                final View view = firstView(selectedViews);
                final int[] viewCenter = center(view);
                final long timestamp = SystemClock.uptimeMillis();
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        view.dispatchTouchEvent(MotionEvent.obtain(
                                timestamp,
                                timestamp,
                                MotionEvent.ACTION_DOWN,
                                viewCenter[0],
                                viewCenter[1],
                                0));
                        view.dispatchTouchEvent(MotionEvent.obtain(
                                timestamp,
                                timestamp + 20,
                                MotionEvent.ACTION_UP,
                                viewCenter[0],
                                viewCenter[1],
                                0));
                    }
                });
                return null;
            }
        });
        registerJsFunction(scope, "back", new JsFunction() {
            @Override
            public Object call(final Activity activity, Object[] args) {
                // TODO: hide keyboard instead if keyboard is showing
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_BACK));
                        activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_BACK));
                    }
                });
                return null;
            }
        });
        registerJsFunction(scope, "hide_keyboard", new JsFunction() {
            @Override
            public Object call(Activity activity, Object[] args) {
                InputMethodManager imm = (InputMethodManager) activity.getSystemService(Context.INPUT_METHOD_SERVICE);
                imm.hideSoftInputFromWindow(getRootView(activity).getWindowToken(), 0);
                return null;
            }
        });
        registerJsFunction(scope, "home", new JsFunction() {
            @Override
            public Object call(Activity activity, Object[] args) {
                Intent homeIntent = new Intent(Intent.ACTION_MAIN);
                homeIntent.addCategory(Intent.CATEGORY_HOME);
                homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(homeIntent);
                return null;
            }
        });
        registerJsFunction(scope, "type_text", new JsFunction() {
            @Override
            public Object call(final Activity activity, Object[] args) {
                final String text = (String) args[0];
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        activity.dispatchKeyEvent(
                                new KeyEvent(SystemClock.uptimeMillis(), text, 0, 0)
                        );
                    }
                });
                return null;
            }
        });
        scope.put("wait", scope, new Callable() {
            @Override
            public Object call(org.mozilla.javascript.Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
                Double seconds = (Double) args[0];
                try {
                    Thread.sleep(Math.round(seconds * 1000.0));
                } catch (InterruptedException e) {
                    throw new RuntimeException(e);
                }
                return null;
            }
        });

        mJsContext.evaluateString(scope, "RegExp; getClass; java; Packages; JavaAdapter;", "lazyLoad", 0, null);
        scope.sealObject();

        mJsScope = mJsContext.newObject(scope);
        mJsScope.setPrototype(scope);
        mJsScope.setParentScope(null);
    }

    @Override
    public Object onStatement(ChetbotServerConnection.Statement stmt, String scriptName) {
        return mJsContext.evaluateString(mJsScope, stmt.getSource(), scriptName, stmt.getLineNo(), null);
    }

    @Override
    public void onFinishScript() {
        mJsContext.exit();
        mJsContext = null;
    }

    private interface JsFunction {
        Object call(Activity activity, Object[] args);
    }

    private interface JsViewFunction {
        Object call(Activity activity, Iterable<View> selectedViews);
    }

    private void registerJsFunction(Scriptable scope, String name, final JsFunction fn) {
        scope.put(name, scope, new Callable() {
            @Override
            public Object call(org.mozilla.javascript.Context cx, Scriptable scope, Scriptable thisObj, final Object[] args) {
                return fn.call(getActivity(), args);
            }
        });
    }

    private void registerJsViewFunction(Scriptable scope, String name, final JsViewFunction fn) {
        scope.put(name, scope, new Callable() {
            @Override
            public Object call(org.mozilla.javascript.Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
                final Activity activity = getActivity();
                final View rootView = getRootView(activity);
                final Iterable<View> selectedViews = selectViews(rootView, args, scope);
                return fn.call(activity, selectedViews);
            }
        });
    }

    public static void start(Activity activity) {
        if (sInstance == null) {
            sInstance = new Chetbot(activity);
            sInstance.connect(activity);
        }
    }

    /**
     * For testing only
     */
    public static Chetbot getInstance() {
        return sInstance;
    }

    // based on https://androidreclib.wordpress.com/2014/11/22/getting-the-current-activity/
    private Activity getActivity(){
        try {
            Class activityThreadClass = Class.forName("android.app.ActivityThread");
            Object activityThread = activityThreadClass.getMethod("currentActivityThread").invoke(null);
            Field activitiesField = activityThreadClass.getDeclaredField("mActivities");
            activitiesField.setAccessible(true);
            // TODO: handle API < 19
            // (ArrayMap is new for API 19)
            ArrayMap activities = (ArrayMap) activitiesField.get(activityThread);
            for (Object activityRecord : activities.values()) {
                Class activityRecordClass = activityRecord.getClass();
                Field pausedField = activityRecordClass.getDeclaredField("paused");
                pausedField.setAccessible(true);
                if (!pausedField.getBoolean(activityRecord)) {
                    Field activityField = activityRecordClass.getDeclaredField("activity");
                    activityField.setAccessible(true);
                    Activity activity = (Activity) activityField.get(activityRecord);
                    if (activity.getPackageName().equals(mPackageName)) {
                        return activity;
                    } else {
                        Log.w(TAG, "Found activity for different package: " + activity.getPackageName());
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        throw new AssertionError("Activity not found");
    }

}
