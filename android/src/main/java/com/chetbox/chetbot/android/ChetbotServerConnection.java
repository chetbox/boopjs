package com.chetbox.chetbot.android;

import android.graphics.Bitmap;
import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import java.net.URI;

import static com.chetbox.chetbot.android.ViewUtils.*;

public class ChetbotServerConnection {

    private static final String TAG = ChetbotServerConnection.class.getSimpleName();

    public interface MessageHandler {
        Object onMessage(Script script) throws IllegalArgumentException;
    }

    public static class Script {

        private String script;
        private String scriptName;
        private int lineNo;
        private String device;

        public Script(String script, String scriptName, int lineNo, String device) {
            this.script = script;
            this.scriptName = scriptName;
            this.lineNo = lineNo;
            this.device = device;
        }

        public String getScript() {
            return script;
        }

        public String getScriptName() {
            return scriptName + "";
        }

        public int getLineNo() {
            return lineNo;
        }
    }


    private static class Result {
        private String device;
        private String type;
        private Object result;

        public Result(String device, String type, Object result) {
            this.device = device;
            this.type = type;
            this.result = result;
        }
    }

    private static class Error {
        private String device;
        private String error;

        public Error(String device, String message) {
            this.device = device;
            this.error = message;
        }
    }

    private Runnable sReconnectWebsocket = new Runnable() {
        private static final long RECONNECT_AFTER_MS = 2000;

        @Override
        public void run() {
            if (mServerConnection != null) {
                mServerConnection.close();
            }
            try {
                Thread.sleep(RECONNECT_AFTER_MS);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            Log.d(TAG, "Reconnecting to ChetBot server...");
            mServerConnection = new ServerConnectionImpl();
            mServerConnection.connect();
        }
    };
    private Thread mReconnectThread = null;

    private static Gson sGson = new GsonBuilder().serializeNulls().create();

    private final URI mHost;
    private final String mDeviceId;
    private final MessageHandler mMessageHandler;

    public ChetbotServerConnection(String host, String deviceId, MessageHandler messageHandler) {
        mHost = URI.create("ws://" + host + "/api/device");
        mDeviceId = deviceId;
        mMessageHandler = messageHandler;
        mServerConnection = new ServerConnectionImpl();
        mServerConnection.connect();
    }

    public static boolean isSupportedResultType(Object o) {
        return o == null
                || o instanceof String
                || o instanceof Integer
                || o instanceof Long
                || o instanceof Float
                || o instanceof Double
                || o instanceof Boolean
                || o instanceof String[]
                || o instanceof int[]
                || o instanceof long[]
                || o instanceof float[]
                || o instanceof double[]
                || o instanceof boolean[]
                || o instanceof Bitmap;
    }

    private static Result makeResult(String device, Object data) {
        String type = (data != null)
            ? data.getClass().getSimpleName().toUpperCase()
            : "NULL";
        if (data instanceof Bitmap) {
            data = base64Encode(toPNG((Bitmap) data));
        }
        return new Result(device, type, data);
    }

    private class ServerConnectionImpl extends WebSocketClient {

        public ServerConnectionImpl() {
            super(mHost);
        }

        @Override
        public void onOpen(ServerHandshake handshakeData) {
            Log.d(TAG, "HTTP " + handshakeData.getHttpStatus() + ": " + handshakeData.getHttpStatusMessage());
            sendAsJson(new DeviceRegistration(mDeviceId));
        }

        @Override
        public void onMessage(String messageStr) {
            Log.v(TAG, "Message received: " + messageStr);
            Script script = sGson.fromJson(messageStr, Script.class);
            try {
                Object result = mMessageHandler.onMessage(script);
                sendAsJson(makeResult(script.device, result));
            } catch (Exception e) {
                Log.e(TAG, "error: " + sGson.toJson(new Error(script.device, e.getMessage())));
                e.printStackTrace();
                sendAsJson(new Error(script.device, e.getMessage()));
            }
        }

        @Override
        public void onClose(int code, String reason, boolean remote) {
            Log.d(TAG, "Connection closed");
            reconnectLater();
        }

        @Override
        public void onError(Exception e) {
            Log.d(TAG, "Disconnected (" + e + ")");
            reconnectLater();
        }

        private void sendAsJson(Object data) {
            send(sGson.toJson(data));
        }

        private void reconnectLater() {
            if (mReconnectThread == null || !mReconnectThread.isAlive()) {
                mServerConnection = null;
                mReconnectThread = new Thread(sReconnectWebsocket);
                mReconnectThread.start();
            }
        }

    }
    private ServerConnectionImpl mServerConnection = null;

}
