package com.chetbox.chetbot.android;

import android.graphics.Bitmap;
import android.util.Log;

import com.chetbox.chetbot.android.util.Images;
import com.chetbox.chetbot.android.util.Logs;
import com.chetbox.chetbot.android.util.Rhino;
import com.google.common.base.Throwables;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.mozilla.javascript.Scriptable;

import java.net.URI;

public class ChetbotServerConnection implements Logs.LogMessageHandler {

    private static final String TAG = ChetbotServerConnection.class.getSimpleName();

    public interface ScriptHandler {
        void setup();
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
        private Object result;

        public Result(String device, int line, Object result) {
            this.device = device;
            this.line = line;
            this.result = result;
        }
    }

    private static class LogMessage {

        private String device;
        private int line;
        private Object log;
        private Logs.Level level;

        public LogMessage(String device, int lineNo, Logs.Level level, Object logObject) {
            this.device = device;
            this.line = lineNo;
            this.log = logObject;
            this.level = level;
        }
    }

    private static class Error {
        private String device;
        private int line;
        private String error;
        private String stacktrace;
        private String type = "execution";

        public Error(String device, int line, Throwable error) {
            this.device = device;
            this.line = line;
            this.error = error.getMessage();
            this.stacktrace = Throwables.getStackTraceAsString(error);
        }
    }

    private static class UncaughtError {
        private String device;
        private String error;
        private String stacktrace;
        private String type = "uncaught";

        public UncaughtError(String device, Throwable error) {
            this.device = device;
            this.error = error.getMessage();
            this.stacktrace = Throwables.getStackTraceAsString(error);
        }
    }

    private static class Success {
        private String device;
        private boolean success;

        public Success(String device, boolean success) {
            this.device = device;
            this.success = success;
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

    private final URI mHost;
    private final String mDeviceId;
    private final ScriptHandler mScriptHandler;

    private volatile int mCurrentLine = 0;
    private volatile boolean mCurrentScriptSuccess;

    private boolean mRequiresSetup = true;


    public ChetbotServerConnection(String host, String deviceId, ScriptHandler scriptHandler) {
        mHost = URI.create("ws://" + host + "/api/device");
        mDeviceId = deviceId;
        mScriptHandler = scriptHandler;
        mServerConnection = new ServerConnectionImpl();
        mServerConnection.connect();
    }

    public void close() {
        mServerConnection.close();
    }
    
    private class ServerConnectionImpl extends WebSocketClient {

        public ServerConnectionImpl() {
            super(mHost);
        }

        @Override
        public void onOpen(ServerHandshake handshakeData) {
            if (mRequiresSetup) {
                mScriptHandler.setup();
                mRequiresSetup = false;
            }
            Log.d(TAG, "HTTP " + handshakeData.getHttpStatus() + ": " + handshakeData.getHttpStatusMessage());
            sendAsJson(new DeviceRegistration(mDeviceId));
        }

        @Override
        public void onMessage(String messageStr) {
            Log.v(TAG, Thread.currentThread().hashCode() + " // Message received: " + messageStr);
            Script script = Rhino.GSON.fromJson(messageStr, Script.class);
            mCurrentLine = 0;
            mCurrentScriptSuccess = true;
            try {
                mScriptHandler.onStartScript();
                for (Statement stmt : script.statements) {
                    if (!mCurrentScriptSuccess) {
                        // Stop if there was an uncaught error
                        break;
                    }
                    mCurrentLine = stmt.line;
                    Object result = mScriptHandler.onStatement(stmt, script.name);
                    sendAsJson(new Result(script.device, stmt.line, result));
                }
            } catch (Throwable e) {
                mCurrentScriptSuccess = false;
                Error error = new Error(script.device, mCurrentLine, e);
                Log.e(TAG, "error: " + Rhino.GSON.toJson(error));
                e.printStackTrace();
                sendAsJson(error);
            } finally {
                sendAsJson(new Success(script.device, mCurrentScriptSuccess));
                mScriptHandler.onFinishScript();
                mCurrentLine = 0;
            }
        }

        private void onUncaughtError(Throwable e) {
            e.printStackTrace();
            mCurrentScriptSuccess = false;
            if (mDeviceId != null) {
                UncaughtError error = new UncaughtError(mDeviceId, e);
                Log.e(TAG, "uncaught error: " + Rhino.GSON.toJson(error));
                sendAsJson(error);
            } else {
                Log.w(TAG, "Not connected. Unable to send to device.");
            }
        }

        private void onLogMessage(Logs.Level level, Object data) {
            if (mDeviceId != null) {
                sendAsJson(new LogMessage(mDeviceId, mCurrentLine, level, data));
            } else {
                Log.w(TAG, "Not connected. Unable to send log message to device.");
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
            send(Rhino.GSON.toJson(data));
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

    public void onUncaughtError(Throwable e) {
        mServerConnection.onUncaughtError(e);
    }

    @Override
    public void onLogMessage(Logs.Level level, Object data) {
        mServerConnection.onLogMessage(level, data);
    }

}
