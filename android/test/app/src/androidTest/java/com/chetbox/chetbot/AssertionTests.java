package com.chetbox.chetbot;

import android.support.test.runner.AndroidJUnit4;

import com.chetbox.chetbot.android.Chetbot;
import com.chetbox.chetbot.android.ChetbotServerConnection;
import com.chetbox.chetbot.base.StopwatchActivityTest;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.rules.TestName;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class AssertionTests extends StopwatchActivityTest {

    @Test public void assertTrue() {
        // No exception
        exec("assert_true(true);");
        exec("assert_true('qwertyuiop');");
        exec("assert_true(12345678);");
        exec("assert_true([1,2,3]);");
        exec("assert_true([]);");

        exception.expect(Exception.class);
        exec("assert_true(false);");
    }

    @Test public void assertFalse() {
        // No exception
        exec("assert_false(false);");
        exec("assert_false(0);");
        exec("assert_false(null);");
        exec("assert_false('');");

        exception.expect(Exception.class);
        exec("assert_false(true);");
    }

    @Test public void assertEqual() {
        // No exception
        exec("assert_equal(true, true);");
        exec("assert_equal(false, false);");
        exec("assert_equal(null, null);");
        exec("assert_equal(12345678, 12345678);");
        exec("assert_equal('qwertyuiop', 'qwertyuiop');");
        exec("assert_equal('123', 123);");

        exception.expect(Exception.class);
        exec("assert_equal(123, 321);");
    }

    @Test public void assertExists() {
        // No exception
        exec("assert_exists('reset');");
        exec("assert_exists({text: 'reset'});");

        exception.expect(Exception.class);
        exec("assert_exists('does not exist');");
    }

}