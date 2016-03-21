package com.chetbox.chetbot.base.screens;

import android.content.Intent;
import android.webkit.WebView;
import android.widget.TextView;

import com.chetbox.chetbot.base.BaseTest;
import com.chetbox.chetbot.test.Intents;
import com.chetbox.chetbot.test.R;

public abstract class WebViewTest extends BaseTest {

    protected WebView webView;
    protected TextView urlView;

    @Override
    public Intent withIntent(Intent intent) {
        intent.putExtra(Intents.SHOW_SCREEN, Intents.SCREEN_WEBVIEW);
        return intent;
    }

    @Override
    public void setUp() {
        super.setUp();
        webView = (WebView) findViewById(R.id.web);
        urlView = (TextView) findViewById(R.id.url);
    }

}
