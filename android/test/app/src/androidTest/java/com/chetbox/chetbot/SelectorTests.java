package com.chetbox.chetbot;

import android.graphics.Bitmap;
import android.support.test.runner.AndroidJUnit4;
import android.widget.Button;
import android.widget.TextView;

import com.chetbox.chetbot.base.StopwatchTest;
import com.chetbox.chetbot.test.MainActivity;
import com.chetbox.chetbot.test.StopwatchFragment;
import com.google.common.collect.ImmutableList;

import org.junit.*;
import org.junit.runner.RunWith;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

@RunWith(AndroidJUnit4.class)
public class SelectorTests extends StopwatchTest {

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
        assertThat((Button) exec("view({id: 'com.chetbox.chetbot.test:id/reset'})"),
                sameInstance(resetButton));
    }

    @Test public void findViewByLongId_notFound() {
        exception.expect(IndexOutOfBoundsException.class);
        exec("view({id: 'com.chetbox.chetbot.test:id/i_do_not_exist'})");
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

    @Test public void activity() {
        assertThat((MainActivity) exec("activity()"), sameInstance(activity));
    }

    @Test public void leftmostView() {
        assertThat((Button) exec("leftmost(_startStopButton_, _resetButton_)"),
                sameInstance(startStopButton));
    }

    @Test public void rightmostView() {
        assertThat((Button) exec("rightmost(_startStopButton_, _resetButton_)"),
                sameInstance(resetButton));
    }

    @Test public void topmostView() {
        assertThat((TextView) exec("topmost(_startStopButton_, _minutesText_)"),
                sameInstance(minutesText));
    }

    @Test public void bottommostView() {
        assertThat((Button) exec("bottommost(_startStopButton_, _minutesText_)"),
                sameInstance(startStopButton));
    }

    @Test public void centermostView() {
        assertThat((TextView) exec("centermost(_minutesText_, _secondsText_, _millisecondsText_)"),
                sameInstance(secondsText));
    }

    @Test public void outermostView() {
        assertThat((TextView) exec("outermost(_minutesText_, _secondsText_, _millisecondsText_)"),
                anyOf(sameInstance(minutesText), sameInstance(millisecondsText)));
    }

    @Test public void allViewIds() {
        assertThat(ImmutableList.copyOf((String[]) exec("view_ids()")),
                hasItems("com.chetbox.chetbot.test:id/drawer_layout",
                        "com.chetbox.chetbot.test:id/content_frame",
                        "com.chetbox.chetbot.test:id/stopwatch_container",
                        "com.chetbox.chetbot.test:id/center",
                        "com.chetbox.chetbot.test:id/minutes",
                        "com.chetbox.chetbot.test:id/seconds",
                        "com.chetbox.chetbot.test:id/milliseconds",
                        "com.chetbox.chetbot.test:id/start_stop",
                        "com.chetbox.chetbot.test:id/reset"));
    }

    @Test public void subViewIds() {
        assertThat(ImmutableList.copyOf((String[]) exec("view_ids({id: 'stopwatch_container'})")),
                contains("com.chetbox.chetbot.test:id/center",
                        "com.chetbox.chetbot.test:id/minutes",
                        "com.chetbox.chetbot.test:id/seconds",
                        "com.chetbox.chetbot.test:id/milliseconds",
                        "com.chetbox.chetbot.test:id/start_stop",
                        "com.chetbox.chetbot.test:id/reset"));
    }
}
