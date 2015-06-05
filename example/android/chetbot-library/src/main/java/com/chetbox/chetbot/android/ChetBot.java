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
import java.util.Iterator;
import java.util.Map;

import fi.iki.elonen.NanoHTTPD;

import static com.chetbox.chetbot.android.ViewUtils.*;

import static com.google.common.collect.Iterables.*;
import static com.google.common.collect.Lists.*;

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

    private Iterable<?> performAction(Command cmd, Activity activity, Iterable<?> lastResults) throws IllegalArgumentException {
        switch (cmd.getName()) {
            case VIEW:
                return concat(transform(asViews(lastResults), new SubViews(cmd.getText(), cmd.getType(), cmd.getId())));
            case COUNT:
                return newArrayList(size(lastResults));
            case EXISTS:
                return newArrayList( !isEmpty(lastResults) );
            case TEXT:
                if (!isEmpty(lastResults)) {
                    TextView tv = ((TextView) firstView(lastResults));
                    return newArrayList( tv.getText().toString() );
                }
            case LOCATION:
                return newArrayList( location(firstView(lastResults)) );
            case CENTER:
                return newArrayList( location(firstView(lastResults)) );
            case SIZE:
                return newArrayList( size(firstView(lastResults)) );
            case LEFTMOST:
                return newArrayList( horizontalOrdering.min(asViews(lastResults)) );
            case RIGHTMOST:
                return newArrayList( horizontalOrdering.max(asViews(lastResults)) );
            case TOPMOST:
                return newArrayList( verticalOrdering.min(asViews(lastResults)) );
            case BOTTOMMOST:
                return newArrayList( verticalOrdering.max(asViews(lastResults)) );
            case CLOSEST_TO: {
                View target = firstView(new ViewUtils.SubViews(cmd.getText(), cmd.getType(), cmd.getId()).apply(getRootView(getActivity())));
                return newArrayList( new EuclidianDistanceOrdering(center(target)).min(asViews(lastResults)) );
            }
            case TAP:
                final View view = firstView(lastResults);
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        view.callOnClick();
                    }
                });
                return lastResults;
            default:
                throw new IllegalArgumentException("Invalid command: " + cmd);
        }
    }

    private Object performAction(Command[] commands) throws IllegalArgumentException {
        if (commands.length == 0) {
            throw new IllegalArgumentException("No commands given");
        }

        Activity activity = getActivity();
        Iterable<?> results = newArrayList(getRootView(activity));
        for (Command cmd : commands) {
            results = performAction(cmd, activity, results);
        }

        Object result = isEmpty(results) ? null : get(results, 0);
        if (result instanceof String
                || result instanceof Integer
                || result instanceof Long
                || result instanceof Float
                || result instanceof Double
                || result instanceof Boolean
                || result instanceof String[]
                || result instanceof int[]
                || result instanceof float[]
                || result instanceof float[]
                || result instanceof long[]
                || result instanceof double[]
                || result instanceof boolean[]) {

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
        return null;

        // The above code snippet lacks exception handling and naively assumes that the first
        // running Activity is the one we’re looking for. You might want to add some additional
        // checks.
    }

}
