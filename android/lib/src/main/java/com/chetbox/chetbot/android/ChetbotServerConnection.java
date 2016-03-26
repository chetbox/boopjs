package com.chetbox.chetbot.android;

import android.util.Log;

import com.chetbox.chetbot.android.util.Logs;
import com.chetbox.chetbot.android.util.Rhino;
import com.google.common.base.Throwables;

import org.java_websocket.client.DefaultSSLWebSocketClientFactory;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import java.net.URI;
import java.security.NoSuchAlgorithmException;

import javax.net.ssl.SSLContext;

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
        private int line;
        private Object result;

        public Result(int line, Object result) {
            this.line = line;
            this.result = result;
        }
    }

    private static class LogMessage {

        private int line;
        private Object log;
        private Logs.Level level;

        public LogMessage(int lineNo, Logs.Level level, Object logObject) {
            this.line = lineNo;
            this.log = logObject;
            this.level = level;
        }
    }

    private static class Error {
        private int line;
        private String error;
        private String stacktrace;
        private String type = "execution";

        public Error(int line, Throwable error) {
            this.line = line;
            this.error = error.getMessage();
            this.stacktrace = Throwables.getStackTraceAsString(error);
        }
    }

    private static class UncaughtError {
        private String error;
        private String stacktrace;
        private String type = "uncaught";

        public UncaughtError(Throwable error) {
            this.error = error.getMessage();
            this.stacktrace = Throwables.getStackTraceAsString(error);
        }
    }

    private static class Ready {
        private boolean ready;

        public Ready(boolean ready) {
            this.ready = ready;
        }
    }

    private static class Success {
        private boolean success;

        public Success(boolean success) {
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
            Log.d(TAG, "Reconnecting to boop.js server...");
            mServerConnection = new ServerConnectionImpl();
            mServerConnection.connect();
        }
    };
    private Thread mReconnectThread = null;

    private final URI mHost;
    private final ScriptHandler mScriptHandler;

    private volatile int mCurrentLine = 0;
    private volatile boolean mCurrentScriptSuccess;

    private boolean mRequiresSetup = true;


    public ChetbotServerConnection(String serverUrl, ScriptHandler scriptHandler) {
        mHost = URI.create(serverUrl);
        mScriptHandler = scriptHandler;
        mServerConnection = new ServerConnectionImpl();
        mServerConnection.connect();
    }

    public void close() {
        if (mServerConnection != null) {
            mServerConnection.close();
        }
    }

    private class ServerConnectionImpl extends WebSocketClient {

        public ServerConnectionImpl() {
            super(mHost);
            if (mHost.getScheme().equals("wss")) {
                try {
                    SSLContext sslContext = SSLContext.getDefault();
                    setWebSocketFactory(new DefaultSSLWebSocketClientFactory(sslContext));
                } catch (NoSuchAlgorithmException e) {
                    e.printStackTrace();
                    onUncaughtError(e);
                }
            }
        }

        @Override
        public void onOpen(ServerHandshake handshakeData) {
            if (mRequiresSetup) {
                mScriptHandler.setup();
                mRequiresSetup = false;
                sendAsJson(new Ready(true));
            }
            Log.d(TAG, "HTTP " + handshakeData.getHttpStatus() + ": " + handshakeData.getHttpStatusMessage());
        }

        @Override
        public void onMessage(String messageStr) {
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
                    sendAsJson(new Result(stmt.line, result));
                }
            } catch (Throwable e) {
                mCurrentScriptSuccess = false;
                Error error = new Error(mCurrentLine, e);
                Log.e(TAG, "error: " + Rhino.GSON.toJson(error));
                e.printStackTrace();
                sendAsJson(error);
            } finally {
                sendAsJson(new Success(mCurrentScriptSuccess));
                mScriptHandler.onFinishScript();
                mCurrentLine = 0;
            }
        }

        private void onUncaughtError(Throwable e) {
            e.printStackTrace();
            mCurrentScriptSuccess = false;
            UncaughtError error = new UncaughtError(e);
            Log.e(TAG, "uncaught error: " + Rhino.GSON.toJson(error));
            sendAsJson(error);
        }

        private void onLogMessage(Logs.Level level, Object data) {
            sendAsJson(new LogMessage(mCurrentLine, level, data));
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
