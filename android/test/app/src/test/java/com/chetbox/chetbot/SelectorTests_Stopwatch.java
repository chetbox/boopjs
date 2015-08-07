package com.chetbox.chetbot;

import android.graphics.Bitmap;
import android.view.View;

import com.chetbox.chetbot.android.Chetbot;
import com.chetbox.chetbot.android.ChetbotServerConnection;
import com.chetbox.chetbot.stopwatch.BuildConfig;
import com.chetbox.chetbot.stopwatch.R;
import com.chetbox.chetbot.stopwatch.StopwatchActivity;
import com.google.common.collect.ImmutableList;

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


@RunWith(RobolectricGradleTestRunner.class)
@Config(constants = BuildConfig.class)
public class SelectorTests_Stopwatch {

    @Rule
    public TestName name = new TestName();

    @Rule
    public final ExpectedException exception = ExpectedException.none();

    StopwatchActivity activity;
    Chetbot chetbot;
    View resetButton;
    View startStopButton;
    View minutesText;
    View secondsText;
    View millisecondsText;

    int linesExecuted = 0;

    @Before
    public void setUp() {
        // These 3 lines have to be done in this order
        Chetbot.setOfflineMode(true);
        activity = Robolectric.setupActivity(StopwatchActivity.class);
        Chetbot.setTestActivity(activity);

        resetButton = activity.findViewById(R.id.reset);
        startStopButton = activity.findViewById(R.id.start_stop);
        minutesText = activity.findViewById(R.id.minutes);
        secondsText = activity.findViewById(R.id.seconds);
        millisecondsText = activity.findViewById(R.id.milliseconds);

        chetbot = Chetbot.getInstance();
        chetbot.onStartScript();

        // Handy references to views in the layout
        exec("var _startStopButton_ = view({id: 'start_stop'});");
        exec("var _resetButton_ = view({id: 'reset'});");
        exec("var _minutesText_ = view({id: 'minutes'});");
        exec("var _secondsText_ = view({id: 'seconds'});");
        exec("var _millisecondsText_ = view({id: 'milliseconds'});");
    }

    @After
    public void tearDown() {
        chetbot.onFinishScript();
    }

    Object exec(String stmt) {
        return chetbot.onStatement(new ChetbotServerConnection.Statement(stmt, ++linesExecuted), name.getMethodName());
    }

    @Test public void viewReturnsInstance() {
        assertThat((View) exec("view(_startStopButton_)"),
                sameInstance(startStopButton));
    }

    @Test public void viewReturnsFirstInstance() {
        assertThat((View) exec("view(_resetButton_, _startStopButton_)"),
                sameInstance(resetButton));
    }

    @Test public void findViewByTextIsDefault() {
        assertThat((View) exec("view('start')"),
                sameInstance(startStopButton));
    }

    @Test public void findViewByText() {
        assertThat((View) exec("view({text: 'start'})"),
                sameInstance(startStopButton));
    }

    @Test public void findViewByText_notFound() {
        exception.expect(IndexOutOfBoundsException.class);
        exec("text({text: 'nonsense'})");
    }

    @Test public void findViewByShortId() {
        assertThat((View) exec("view({id: 'start_stop'})"),
                sameInstance(startStopButton));
    }

    @Test public void findViewByShortId_notFound() {
        exception.expect(IndexOutOfBoundsException.class);
        exec("view({id: 'i_do_not_exist'})");
    }

    @Test public void findViewByLongId() {
        assertThat((View) exec("view({id: 'com.chetbox.chetbot.stopwatch:id/reset'})"),
                sameInstance(resetButton));
    }

    @Test public void findViewByLongId_notFound() {
        exception.expect(IndexOutOfBoundsException.class);
        exec("view({id: 'com.chetbox.chetbot.stopwatch:id/i_do_not_exist'})");
    }

    @Test public void findViewsByClassName() {
        assertThat((View) exec("view({type: 'android.support.v7.widget.AppCompatButton', text: 'start'})"),
                sameInstance(startStopButton));

        assertThat((View) exec("view({type: 'android.support.v7.widget.AppCompatButton', text: 'reset'})"),
                sameInstance(resetButton));
    }

    @Test public void findViewsByClassSimpleName() {
        assertThat((View) exec("view({type: 'AppCompatButton', text: 'start'})"),
                sameInstance(startStopButton));

        assertThat((View) exec("view({type: 'AppCompatButton', text: 'reset'})"),
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

        assertThat("[start] left of [reset]",
                startStopLocation[0], lessThan(resetLocation[0]));

        assertThat("Same vertical alignment",
                startStopLocation[1], equalTo(resetLocation[1]));
    }

    @Test public void centerOfHorizontalButtons() {
        int[] startStopCenter = (int[]) exec("center(_startStopButton_)");
        int[] resetCenter = (int[]) exec("center(_resetButton_)");

        assertThat("[start] left of [reset]",
                startStopCenter[0], lessThan(resetCenter[0]));

        assertThat("Same vertical alignment",
                startStopCenter[1], equalTo(resetCenter[1]));
    }

    @Test public void sizeOfButton() {
        int[] resetSize = (int[]) exec("size(_resetButton_)");

        assertThat(resetSize[0], greaterThan(1));
        assertThat(resetSize[1], greaterThan(1));
    }

    @Test public void location_center_size() {
        int[] resetSize = (int[]) exec("size(_resetButton_)");
        int[] resetCenter = (int[]) exec("center(_resetButton_)");
        int[] resetLocation = (int[]) exec("location(_resetButton_)");

        assertThat(resetCenter[0], equalTo(resetLocation[0] + resetSize[0] / 2));
        assertThat(resetCenter[1], equalTo(resetLocation[1] + resetSize[1] / 2));
    }

    @Test public void screenshotPngDataUrl() {
        assertThat((Bitmap) exec("screenshot()"), isA(Bitmap.class));
    }

    @Test public void getActivity() {
        assertThat((StopwatchActivity) exec("activity()"), sameInstance(activity));
    }

    @Test public void leftmostView() {
        assertThat((View) exec("leftmost(_startStopButton_, _resetButton_)"),
                sameInstance(startStopButton));
    }

    @Test public void rightmostView() {
        assertThat((View) exec("rightmost(_startStopButton_, _resetButton_)"),
                sameInstance(resetButton));
    }

    @Test public void topmostView() {
        assertThat((View) exec("topmost(_startStopButton_, _minutesText_)"),
                sameInstance(minutesText));
    }

    @Test public void bottommostView() {
        assertThat((View) exec("bottommost(_startStopButton_, _minutesText_)"),
                sameInstance(startStopButton));
    }

    @Test public void allViewIds() {
        assertThat(ImmutableList.copyOf((String[]) exec("view_ids()")),
                contains("com.chetbox.chetbot.stopwatch:id/stopwatch_container",
                        "com.chetbox.chetbot.stopwatch:id/center",
                        "com.chetbox.chetbot.stopwatch:id/minutes",
                        "com.chetbox.chetbot.stopwatch:id/seconds",
                        "com.chetbox.chetbot.stopwatch:id/milliseconds",
                        "com.chetbox.chetbot.stopwatch:id/start_stop",
                        "com.chetbox.chetbot.stopwatch:id/reset"));
    }

    @Test public void subViewIds() {
        assertThat(ImmutableList.copyOf((String[]) exec("view_ids({id: 'stopwatch_container'})")),
                contains("com.chetbox.chetbot.stopwatch:id/center",
                        "com.chetbox.chetbot.stopwatch:id/minutes",
                        "com.chetbox.chetbot.stopwatch:id/seconds",
                        "com.chetbox.chetbot.stopwatch:id/milliseconds",
                        "com.chetbox.chetbot.stopwatch:id/start_stop",
                        "com.chetbox.chetbot.stopwatch:id/reset"));
    }
}
