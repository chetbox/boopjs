package com.chetbox.chetbot;

import com.chetbox.chetbot.android.Chetbot;
import com.chetbox.chetbot.android.ChetbotServerConnection;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.rules.TestName;

public class AssertionTests {

    Chetbot chetbot;
    int linesExecuted;

    @Rule
    public final ExpectedException exception = ExpectedException.none();

    @Rule
    public TestName testName = new TestName();

    @Before
    public void setUp() {
        Chetbot.setOfflineMode(true);
        Chetbot.start(null);
        chetbot = Chetbot.getInstance();
        chetbot.onStartScript();
        linesExecuted = 0;
    }

    @After
    public void tearDown() {
        chetbot.onFinishScript();
    }

    Object exec(String stmt) {
        return chetbot.onStatement(new ChetbotServerConnection.Statement(stmt, ++linesExecuted), testName.getMethodName());
    }

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
}
