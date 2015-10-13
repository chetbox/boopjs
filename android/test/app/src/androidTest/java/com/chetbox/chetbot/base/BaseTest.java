package com.chetbox.chetbot.base;

import android.app.Activity;
import android.content.Intent;
import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.core.deps.guava.base.Joiner;
import android.support.test.rule.ActivityTestRule;
import android.support.test.runner.AndroidJUnit4;
import android.support.v4.widget.DrawerLayout;
import android.view.View;

import com.chetbox.chetbot.android.Chetbot;
import com.chetbox.chetbot.android.ChetbotServerConnection;
import com.chetbox.chetbot.test.MainActivity;
import com.chetbox.chetbot.test.R;
import com.chetbox.chetbot.util.AssetServer;
import com.squareup.okhttp.mockwebserver.MockWebServer;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.rules.ExpectedException;
import org.junit.rules.TestName;
import org.junit.runner.RunWith;
import org.mozilla.javascript.Wrapper;

@RunWith(AndroidJUnit4.class)
public abstract class BaseTest {

    public Intent withIntent(Intent intent) {
        return intent;
    }

    private static MockWebServer mAssetServer = AssetServer.server(InstrumentationRegistry.getInstrumentation().getContext());

    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<MainActivity>(MainActivity.class) {
        @Override
        protected Intent getActivityIntent() {
            Intent intent = super.getActivityIntent();
            intent.putExtra("chetbot.server", mAssetServer.getHostName() + ":" + mAssetServer.getPort());
            return withIntent(intent);
        }
    };

    @Rule
    public TestName name = new TestName();

    @Rule
    public final ExpectedException exception = ExpectedException.none();

    private Chetbot chetbot;

    protected DrawerLayout drawerLayout;

    int linesExecuted = 0;

    @Before
    public void setUp() {
        // These lines have to be done in this order
        Activity activity = mActivityRule.getActivity();
        chetbot = Chetbot.getInstance(activity);
        chetbot.setup();
        chetbot.onStartScript();

        drawerLayout = (DrawerLayout) activity.findViewById(R.id.drawer_layout);
    }

    @After
    public void tearDown() {
        chetbot.onFinishScript();
        Chetbot.reset();
    }

    protected <T> T exec(String... stmts) {
        String script = Joiner.on('\n').join(stmts);
        return (T) unwrap(chetbot.onStatement(new ChetbotServerConnection.Statement(script, ++linesExecuted), name.getMethodName()));
    }

    protected View findViewById(int id) {
        return mActivityRule.getActivity().findViewById(id);
    }

    protected Activity getActivity() {
        return mActivityRule.getActivity();
    }

    private static Object unwrap(Object obj) {
        return obj instanceof Wrapper ? ((Wrapper) obj).unwrap() : obj;
    }

}
