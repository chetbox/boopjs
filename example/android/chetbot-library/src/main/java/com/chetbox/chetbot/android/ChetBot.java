package com.chetbox.chetbot.android;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.util.ArrayMap;
import android.util.Log;
import android.view.View;
import android.widget.TextView;

import com.google.gson.Gson;

import java.io.IOException;
import java.io.StringReader;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import fi.iki.elonen.NanoHTTPD;

public class ChetBot extends NanoHTTPD {

    private static final String TAG = ChetBot.class.getSimpleName();
    private static final Gson sGson = new Gson();

    private static ChetBot sInstance = null;

    private final String mPackageName;

    private ChetBot(Context context) {
        super(8897);
        mPackageName = context.getPackageName();

        // Start Webserver
        try {
            start();
        } catch (IOException e) {
            new AlertDialog.Builder(context)
                    .setTitle("ChetBot error")
                    .setMessage("ChetBot failed to start:\n" + e)
                    .setNeutralButton("Okay", null)
                    .create()
                    .show();
        }
    }

    /*
     * Web Server
     */

    @Override
    public NanoHTTPD.Response serve(NanoHTTPD.IHTTPSession session) {
        Log.d(TAG, session.getMethod() + " " + session.getUri());
        switch (session.getMethod()) {
            case GET:
                return new NanoHTTPD.Response(Response.Status.OK, MIME_PLAINTEXT, "beep boop bleep\n");
            case POST:
                try {
                    String command = session.getUri().substring(1);
                    Map<String, String> files = session.getParms();
                    session.parseBody(files);
                    Log.v(TAG, "params: " + session.getParms());
                    if (!files.containsKey("commands")) {
                        throw new IllegalArgumentException("Missing key: commands");
                    }
                    Command[] commands = sGson.fromJson(new StringReader(files.get("commands")), Command[].class);
                    Object result = performAction(commands);
                    return new NanoHTTPD.Response(Response.Status.OK, "application/json", sGson.toJson(result));
                } catch (Exception e) {
                    e.printStackTrace();
                    return new NanoHTTPD.Response(Response.Status.INTERNAL_ERROR, MIME_PLAINTEXT, e.getClass().getSimpleName() + ": " + e.getMessage());
                }
            default:
                return new NanoHTTPD.Response(Response.Status.NOT_FOUND, MIME_PLAINTEXT, "Nothing to see here\n");
        }
    }

    private Object performAction(Command[] commands) throws IllegalArgumentException {
        Activity activity = getActivity();
        Object result = getRootView(activity);
        for (Command cmd : commands) {
            switch (cmd.getName()) {
                case VIEW:
                    result = findView(cmd.getArgs(), (View) result);
                    break;
                case TEXT:
                    result = ((TextView) result).getText().toString();
                    break;
                case TAP:
                    final View view = (View) result;
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            view.callOnClick();
                        }
                    });
                    break;
                default:
                    throw new IllegalArgumentException("Invalid command: " + cmd);
            }
        }
        if (result.getClass() == String.class
                || result.getClass() == Integer.class
                || result.getClass() == Long.class
                || result.getClass() == Float.class
                || result.getClass() == Double.class) {

            return result;
        } else {
            return null;
        }
    }

    public static void start(Context context) {
        if (sInstance == null) {
            sInstance = new ChetBot(context);
        }
    }

    public static ChetBot get() {
        return sInstance;
    }

    private Activity getActivity(){
        try {
            Class activityThreadClass = Class.forName("android.app.ActivityThread");
            Object activityThread = activityThreadClass.getMethod("currentActivityThread").invoke(null);
            Field activitiesField = activityThreadClass.getDeclaredField("mActivities");
            activitiesField.setAccessible(true);
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
        return null;

        // The above code snippet lacks exception handling and naively assumes that the first
        // running Activity is the one we’re looking for. You might want to add some additional
        // checks.
    }

    private static View getRootView(Activity activity) {
        return activity.getWindow().getDecorView().findViewById(android.R.id.content);
    }

    private static View findView(String[] args, View view) {
        final ArrayList<View> matchingViews = new ArrayList<View>();
        view.findViewsWithText(matchingViews, args[0], View.FIND_VIEWS_WITH_TEXT);
        if (matchingViews.size() == 0) {
            throw new RuntimeException("View not found: " + args[0]);
        }
        return matchingViews.get(0);
    }
}
