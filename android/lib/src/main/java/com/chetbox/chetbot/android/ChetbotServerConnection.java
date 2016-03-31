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

    public static class Scripts {
        private Script[] scripts;
    }

    public static class Script {
        private Statement[] statements;
        private String id;
    }

    public static class ScriptLocation {
        private String id;
        private int line;

        public ScriptLocation(String id, int line) {
            this.id = id;
            this.line = line;
        }
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
        private ScriptLocation location;
        private Object result;

        public Result(ScriptLocation location, Object result) {
            this.location = location;
            this.result = result;
        }
    }

    private static class LogMessage {

        private ScriptLocation location;
        private Object log;
        private Logs.Level level;

        public LogMessage(ScriptLocation location, Logs.Level level, Object logObject) {
            this.location = location;
            this.log = logObject;
            this.level = level;
        }
    }

    private static class Error {
        private ScriptLocation location;
        private String error;
        private String stacktrace;
        private String type = "execution";

        public Error(ScriptLocation location, Throwable error) {
            this.location = location;
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
    private volatile String mCurrentScript = null;
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
            }
            Log.d(TAG, "HTTP " + handshakeData.getHttpStatus() + ": " + handshakeData.getHttpStatusMessage());
        }

        @Override
        public void onMessage(String messageStr) {
            Scripts scriptList = Rhino.GSON.fromJson(messageStr, Scripts.class);
            try {
                for (Script script : scriptList.scripts) {
                    mCurrentScript = script.id;
                    mCurrentLine = 0;
                    mCurrentScriptSuccess = true;
                    mScriptHandler.onStartScript();
                    for (Statement stmt : script.statements) {
                        if (!mCurrentScriptSuccess) {
                            // Stop if there was an uncaught error
                            break;
                        }
                        mCurrentLine = stmt.line;
                        Object result = mScriptHandler.onStatement(stmt, script.id);
                        sendAsJson(new Result(new ScriptLocation(script.id, stmt.line), result));
                    }
                }
            } catch (Throwable e) {
                mCurrentScriptSuccess = false;
                Error error = new Error(new ScriptLocation(mCurrentScript, mCurrentLine), e);
                Log.e(TAG, "error: " + Rhino.GSON.toJson(error));
                e.printStackTrace();
                sendAsJson(error);
            } finally {
                sendAsJson(new Success(mCurrentScriptSuccess));
                mScriptHandler.onFinishScript();
                mCurrentLine = 0;
                mCurrentScript = null;
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
            sendAsJson(new LogMessage(new ScriptLocation(mCurrentScript, mCurrentLine), level, data));
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
