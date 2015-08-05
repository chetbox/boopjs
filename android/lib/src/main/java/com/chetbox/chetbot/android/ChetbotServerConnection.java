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

    public interface ScriptHandler {
        void onStartScript();
        Object onStatement(Statement stmt, String scriptName);
        void onFinishScript();
    }

    public static class Script {
        private Statement[] statements;
        private String name;
        private String device;
    }

    public static class Statement {

        private String source;
        private int line;

        public Statement(String source, int line) {
            this.source = source;
            this.line = line;
        }

        public String getSource() {
            return source;
        }

        public int getLine() {
            return line;
        }
    }

    private static class Result {
        private String device;
        private int line;
        private String type;
        private Object result;

        public Result(String device, int line, String type, Object result) {
            this.device = device;
            this.line = line;
            this.type = type;
            this.result = result;
        }
    }

    private static class Error {
        private String device;
        private int line;
        private String error;

        public Error(String device, int line, String message) {
            this.device = device;
            this.line = line;
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
    private final ScriptHandler mScriptHandler;

    public ChetbotServerConnection(String host, String deviceId, ScriptHandler scriptHandler) {
        mHost = URI.create("ws://" + host + "/api/device");
        mDeviceId = deviceId;
        mScriptHandler = scriptHandler;
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

    private static Result makeResult(String device, int lineNo, Object data) {
        String type = (data != null)
            ? data.getClass().getSimpleName().toUpperCase()
            : "NULL";
        if (data instanceof Bitmap) {
            // Convert to base64 representation for browser rendering
            data = "data:image/png;base64," + base64Encode(toPNG((Bitmap) data));
        }
        return new Result(device, lineNo, type, data);
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
                mScriptHandler.onStartScript();
                for (Statement stmt : script.statements) {
                    try {
                        Object result = mScriptHandler.onStatement(stmt, script.name);
                        sendAsJson(makeResult(script.device, stmt.line, result));
                    } catch (Exception e) {
                        Error error = new Error(script.device, stmt.line, e.getMessage());
                        Log.e(TAG, "error: " + sGson.toJson(error));
                        e.printStackTrace();
                        sendAsJson(error);
                    }
                }
             } finally {
                mScriptHandler.onFinishScript();
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
