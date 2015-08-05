package com.chetbox.chetbot.stopwatch;

import android.widget.Button;

import com.chetbox.chetbot.android.Chetbot;
import com.chetbox.chetbot.android.ChetbotServerConnection;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.rules.TestName;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricGradleTestRunner;
import org.robolectric.annotation.Config;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;


@RunWith(RobolectricGradleTestRunner.class)
@Config(constants = BuildConfig.class)
public class ChetbotTest {

    @Rule
    public TestName name = new TestName();

    @Rule
    public final ExpectedException exception = ExpectedException.none();

    StopwatchActivity activity;
    Chetbot chetbot;
    Button resetButton;
    Button startStopButton;

    int linesExecuted = 0;

    @Before
    public void setUp() {
        // These 3 lines have to be done in this order
        Chetbot.setOfflineMode(true);
        activity = Robolectric.setupActivity(StopwatchActivity.class);
        Chetbot.setTestActivity(activity);

        resetButton = (Button) activity.findViewById(R.id.reset);
        startStopButton = (Button) activity.findViewById(R.id.start_stop);

        chetbot = Chetbot.getInstance();
        chetbot.onStartScript();

        // Handy references to views in the layout
        exec("var _startStopButton_ = view({id: 'start_stop'});");
        exec("var _resetButton_ = view({id: 'reset'});");
    }

    @After
    public void tearDown() {
        chetbot.onFinishScript();
    }

    Object exec(String stmt) {
        return chetbot.onStatement(new ChetbotServerConnection.Statement(stmt, ++linesExecuted), name.getMethodName());
    }

    @Test public void viewReturnsInstance() {
        assertThat((Button) exec("view(_startStopButton_)"),
                sameInstance(startStopButton));
    }

    @Test public void viewReturnsFirstInstance() {
        assertThat((Button) exec("view(_resetButton_, _startStopButton_)"),
                sameInstance(resetButton));
    }

    @Test public void findViewByTextIsDefault() {
        assertThat((Button) exec("view('start')"),
                sameInstance(startStopButton));
    }

    @Test public void findViewByText() {
        assertThat((Button) exec("view({text: 'start'})"),
                sameInstance(startStopButton));
    }

    @Test public void findViewByText_notFound() {
        exception.expect(IndexOutOfBoundsException.class);
        exec("text({text: 'nonsense'})");
    }

    @Test public void findViewByShortId() {
        assertThat((Button) exec("view({id: 'start_stop'})"),
                sameInstance(startStopButton));
    }

    @Test public void findViewByShortId_notFound() {
        exception.expect(IndexOutOfBoundsException.class);
        exec("view({id: 'i_do_not_exist'})");
    }

    @Test public void findViewByLongId() {
        assertThat((Button) exec("view({id: 'com.chetbox.chetbot.stopwatch:id/reset'})"),
                sameInstance(resetButton));
    }

    @Test public void findViewByLongId_notFound() {
        exception.expect(IndexOutOfBoundsException.class);
        exec("view({id: 'com.chetbox.chetbot.stopwatch:id/i_do_not_exist'})");
    }

    @Test public void findViewsByClassName() {
        assertThat((Button) exec("view({type: 'android.support.v7.widget.AppCompatButton', text: 'start'})"),
                sameInstance(startStopButton));

        assertThat((Button) exec("view({type: 'android.support.v7.widget.AppCompatButton', text: 'reset'})"),
                sameInstance(resetButton));
    }

    @Test public void findViewsByClassSimpleName() {
        assertThat((Button) exec("view({type: 'AppCompatButton', text: 'start'})"),
                sameInstance(startStopButton));

        assertThat((Button) exec("view({type: 'AppCompatButton', text: 'reset'})"),
                sameInstance(resetButton));
    }

    @Test public void textViewExists() {
        assertThat((Boolean) exec("exists('reset')"),
                equalTo(Boolean.TRUE));
    }

    @Test public void textViewDoesNotExist() {
        assertThat((Boolean) exec("exists('i do not exist')"),
                equalTo(Boolean.FALSE));
    }

    @Test public void viewType() {
        assertThat((String) exec("class_of(_resetButton_)"),
                equalTo("AppCompatButton"));
    }

    @Test public void viewText() {
        assertThat((String) exec("text(_startStopButton_)"),
                equalToIgnoringCase("start"));
    }

    @Test public void viewText_notTextView() {
        exception.expect(ClassCastException.class);
        exec("text({type: 'RelativeLayout'})");
    }

    @Test public void countInstances() {
        assertThat((Integer) exec("count(_startStopButton_, _resetButton_)"),
                equalTo(2));
    }

    @Test public void countViewsWithClassSimpleName() {
        assertThat((Integer) exec("count({type: 'AppCompatButton'})"),
                equalTo(2));
    }

    @Test public void countViewsWithText() {
        assertThat((Integer) exec("count('00')"),
                equalTo(2));
    }

    @Test public void locationOfHorizontalButtons() {
        int[] startStopLocation = (int[]) exec("location(_startStopButton_)");
        int[] resetLocation = (int[]) exec("location(_resetButton_)");

        assertTrue("startStop left of reset", startStopLocation[0] < resetLocation[0]);
        assertEquals("Same vertical alignment", startStopLocation[1], resetLocation[1]);
    }

    @Test public void centerOfHorizontalButtons() {
        int[] startStopCenter = (int[]) exec("center(_startStopButton_)");
        int[] resetCenter = (int[]) exec("center(_resetButton_)");

        assertTrue("startStop left of reset", startStopCenter[0] < resetCenter[0]);
        assertEquals("Same vertical alignment", startStopCenter[1], resetCenter[1]);
    }

    @Test public void sizeOfButton() {
        int[] resetSize = (int[]) exec("size(_resetButton_)");

        assertTrue(resetSize[0] > 0);
        assertTrue(resetSize[1] > 0);
    }

    @Test public void location_center_size() {
        int[] resetSize = (int[]) exec("size(_resetButton_)");
        int[] resetCenter = (int[]) exec("center(_resetButton_)");
        int[] resetLocation = (int[]) exec("location(_resetButton_)");

        assertEquals(resetCenter[0], resetLocation[0] + resetSize[0] / 2);
        assertEquals(resetCenter[1], resetLocation[1] + resetSize[1] / 2);
    }

}
