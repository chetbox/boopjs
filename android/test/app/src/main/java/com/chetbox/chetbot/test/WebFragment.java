package com.chetbox.chetbot.test;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;


public class WebFragment extends Fragment {

    private WebView mWebView;
    private TextView mUrlTextView;

    private static final String PAGE = "<html><body>" +
            "<h1>Example.com Search</h1>" +
            "<form action='https://www.example.com/search'>" +
            "<input name='q' type='text'/>" +
            "<input type='submit' name='sa' value='Search' />" +
            "</form>" +
            "<script>document.body.innerHTML = 'nope';</script>" +
            "</body></html>";

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.web, container, false);

        mUrlTextView = (TextView) view.findViewById(R.id.url);

        mWebView = (WebView) view.findViewById(R.id.web);
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView webView, String url) {
                webView.loadUrl(url);
                mUrlTextView.setText(url);
                return true;
            }
        });
        mWebView.loadData(PAGE, "text/html", "US-ASCII");

        return view;
    }

}
