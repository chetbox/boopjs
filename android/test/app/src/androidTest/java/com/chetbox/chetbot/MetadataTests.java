package com.chetbox.chetbot;

import com.chetbox.chetbot.android.js.Version;
import com.chetbox.chetbot.base.BaseTest;
import com.chetbox.chetbot.test.MainActivity;

import org.junit.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.sameInstance;

public class MetadataTests extends BaseTest {

    @Test public void version() {
        assertThat((String) exec("version"),
                equalTo(Version.VERSION));
    }

    @Test public void activity() {
        assertThat((MainActivity) exec("activity()"),
                sameInstance(getActivity()));
    }

}
