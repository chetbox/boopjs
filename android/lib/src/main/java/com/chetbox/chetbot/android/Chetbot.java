package com.chetbox.chetbot.android;

import android.app.Activity;
import android.support.test.espresso.core.deps.guava.collect.ObjectArrays;
import android.text.TextUtils;
import android.util.Log;
import android.widget.Toast;

import com.chetbox.chetbot.android.util.Activities;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.Response;

import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

public class Chetbot implements ChetbotServerConnection.ScriptHandler {

    private static final String TAG = Chetbot.class.getSimpleName();

    private static final String CHETBOT_LIB_ENDPOINT = "/device/android.js";

    private static Chetbot sInstance = null;

    private final String mPackageName;
    private ChetbotServerConnection mServerConnection = null;

    private org.mozilla.javascript.Context mJsContext;
    private Scriptable mJsScope;

    private String mServer;
    private String[] mScriptsUrls = new String[]{};
    private String mUserScript = null;


    private Chetbot(Activity activity) {
        mServer = activity.getIntent().getStringExtra("chetbot.server");

        if (!TextUtils.isEmpty(mServer)) {
            mScriptsUrls = new String[]{"http://" + mServer + CHETBOT_LIB_ENDPOINT};
        }

        String extraScriptUrls = activity.getIntent().getStringExtra("chetbot.scripts");
        if (extraScriptUrls != null) {
            mScriptsUrls = ObjectArrays.concat(mScriptsUrls, extraScriptUrls.split(","), String.class);
        }

        mUserScript = activity.getIntent().getStringExtra("chetbot.exec");

        mPackageName = activity.getPackageName();
    }

    public void connect(final Activity activity) {
        String deviceId = activity.getIntent().getStringExtra("chetbot.device");
        boolean quiet = !TextUtils.isEmpty( activity.getIntent().getStringExtra("chetbot.quiet") );

        // Connect to Chetbot server
        if (!TextUtils.isEmpty(mServer) && !TextUtils.isEmpty(deviceId)) {

            Log.d(TAG, "Starting ChetBot (" + deviceId + ")");
            if (!quiet) {
                Toast.makeText(activity, "Starting ChetBot", Toast.LENGTH_SHORT).show();
            }
            mServerConnection = new ChetbotServerConnection(mServer, deviceId, this);

            UncaughtExceptionHandler.addListener(new UncaughtExceptionHandler.ExceptionListener() {
                @Override
                public void exception(Throwable e) {
                    mServerConnection.onUncaughtError(e);
                }
            });
        }
    }

    @Override
    public void setup() {
        // Set up JavaScript environment
        mJsContext = org.mozilla.javascript.Context.enter();
        mJsContext.setOptimizationLevel(-1);
        ScriptableObject scope = mJsContext.initStandardObjects();

        mJsContext.evaluateString(scope, "RegExp; getClass; java; Packages; JavaAdapter;", "<lazy_load>", 1, null);
        mJsContext.evaluateString(scope, "var package_name = '" + mPackageName + "';", "<package_name>", 1, null);
        scope.sealObject();

        mJsScope = mJsContext.newObject(scope);
        mJsScope.setPrototype(scope);
        mJsScope.setParentScope(null);

        OkHttpClient client = new OkHttpClient();
        try {
            for (final String scriptUrl : mScriptsUrls) {
                Log.d(TAG, "Loading " + scriptUrl);
                Request request = new Request.Builder()
                        .url(scriptUrl)
                        .build();
                Response response = client.newCall(request).execute();
                if (!response.isSuccessful()) {
                    throw new RuntimeException("HTTP Error " + response.code() + ": " + response.message());
                }
                String script = response.body().string();

                onStatement(new ChetbotServerConnection.Statement(script, 1), scriptUrl);
                Log.d(TAG, "Loaded " + scriptUrl);
            }
            if (mUserScript != null) {
                onStatement(new ChetbotServerConnection.Statement(mUserScript, 1), "<user>");
            }
        } catch (final Exception e) {
            Log.e(TAG, e.getClass().getSimpleName() + ": " + e.getMessage());
            e.printStackTrace();
            final Activity activity = Activities.getActivity(mPackageName);
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(activity, e.getClass().getSimpleName() + ": " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
            if (mServerConnection != null) {
                mServerConnection.onUncaughtError(e);
            }
        }
    }

    @Override
    public void onStartScript() {}

    @Override
    public Object onStatement(ChetbotServerConnection.Statement stmt, String scriptName) {
        return mJsContext.evaluateString(mJsScope, stmt.getSource(), scriptName, stmt.getLine(), null);
    }

    @Override
    public void onFinishScript() {}

    public static void reset() {
        if (sInstance != null) {
            if (sInstance.mServerConnection != null) {
                sInstance.mServerConnection.close();
            }
            if (sInstance.mJsContext != null) {
                sInstance.mJsContext = null;
                sInstance.mJsScope = null;
                org.mozilla.javascript.Context.exit();
            }
        }
        sInstance = null;
    }

    public static Chetbot getInstance(Activity activity) {
        if (sInstance == null) {
            sInstance = new Chetbot(activity);
        }
        return sInstance;
    }

}
