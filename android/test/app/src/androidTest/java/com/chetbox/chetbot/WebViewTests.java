package com.chetbox.chetbot;

import com.chetbox.chetbot.base.screens.WebViewTest;

import org.junit.Test;
import org.mozilla.javascript.JavaScriptException;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

public class WebViewTests extends WebViewTest {

    @Test public void fillAndSubmitForm() {
        exec(   "in_webview({type: 'WebView'}, function() {",
                "  document.querySelector('input[name=q]').value = 'boop';",
                "  document.querySelector('form').submit();",
                "});");

        String url = urlView.getText().toString();
        assertThat(url, equalTo("https://www.example.com/search?q=boop"));
    }

    @Test public void returnsData() {
        exec(   "var button_text = in_webview({type: 'WebView'}, function() {",
                "  return document.querySelector('input[type=submit]').value;",
                "});");

        String buttonText = exec("button_text");
        assertThat(buttonText, equalTo("\"Search\""));
    }

    @Test(expected = JavaScriptException.class)
    public void noWebViewError() {
        exec("in_webview({type: 'DoesNotExist'}, function() {});");
    }

    @Test(expected = JavaScriptException.class)
    public void notAWebViewError() {
        exec("in_webview({type: 'AppCompatTextView'}, function() {});");
    }

}
