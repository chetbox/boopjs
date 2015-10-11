package com.chetbox.chetbot.util;

import android.content.Context;
import android.support.test.espresso.core.deps.guava.base.Throwables;
import android.util.Log;

import com.squareup.okhttp.mockwebserver.Dispatcher;
import com.squareup.okhttp.mockwebserver.MockResponse;
import com.squareup.okhttp.mockwebserver.MockWebServer;
import com.squareup.okhttp.mockwebserver.RecordedRequest;

import java.io.IOException;
import java.io.InputStream;

import okio.Buffer;

public class AssetServer {

    private AssetServer() {}

    public static MockWebServer server(final Context context) {
        MockWebServer server = new MockWebServer();
        server.setDispatcher(new Dispatcher() {
            @Override
            public MockResponse dispatch(RecordedRequest recordedRequest) throws InterruptedException {
                String path = recordedRequest.getPath().replaceFirst("^/", "");
                try {
                    InputStream assetStream = context.getAssets().open(path);
                    return new MockResponse()
                            .setResponseCode(200)
                            .setBody(new Buffer().readFrom(assetStream));
                } catch (IOException e) {
                    e.printStackTrace();
                    return new MockResponse()
                            .setStatus("HTTP/1.1 " + 400 + " " + e.getClass().getSimpleName())
                            .setBody(Throwables.getStackTraceAsString(e));
                }
            }
        });
        return server;
    }

}
