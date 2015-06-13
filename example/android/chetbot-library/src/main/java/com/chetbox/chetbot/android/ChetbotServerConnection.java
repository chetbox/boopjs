package com.chetbox.chetbot.android;

import android.util.Log;

import com.google.gson.Gson;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import java.net.URI;

public class ChetbotServerConnection extends WebSocketClient {

    private static final String TAG = ChetbotServerConnection.class.getSimpleName();

    private static Gson sGson = new Gson();

    public ChetbotServerConnection() {
        super(URI.create("ws://lec2-54-77-127-243.eu-west-1.compute.amazonaws.com"));
    }

    @Override
    public void onOpen(ServerHandshake handshakeData) {
        Log.d(TAG, "HTTP " + handshakeData.getHttpStatus() + ": " + handshakeData.getHttpStatusMessage());
        send(sGson.toJson(new Command(Command.Name.REGISTER_DEVICE, "my_magic_device_1234567890")));
    }

    @Override
    public void onClose(int code, String reason, boolean remote) {
        Log.d(TAG, "Connection closed (" + reason + ")");
    }

    @Override
    public void onMessage(String message) {
        Log.v(TAG, "Message received: " + message);
    }

    @Override
    public void onError(Exception e) {
        e.printStackTrace();
    }
}
