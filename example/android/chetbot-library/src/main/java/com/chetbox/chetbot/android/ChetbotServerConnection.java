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
        Object onMessage(Command[] message) throws IllegalArgumentException;
    }

    public static class Message {
        private String device;
        private Command[] commands;

        public Command[] getCommands() {
            return commands.clone();
        }

        public String getDevice() {
            return device;
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

    private final String mSessionId;
    private final MessageHandler mMessageHandler;

    public ChetbotServerConnection(String sessionId, MessageHandler messageHandler) {
        mSessionId = sessionId;
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
            super(URI.create("ws://ec2-54-77-127-243.eu-west-1.compute.amazonaws.com"));
        }

        @Override
        public void onOpen(ServerHandshake handshakeData) {
            Log.d(TAG, "HTTP " + handshakeData.getHttpStatus() + ": " + handshakeData.getHttpStatusMessage());
            send(sGson.toJson(new Command(Command.Name.REGISTER_DEVICE_SESSION, mSessionId)));
        }

        @Override
        public void onMessage(String messageStr) {
            Log.v(TAG, "Message received: " + messageStr);
            Message message = sGson.fromJson(messageStr, Message.class);
            try {
                Object result = mMessageHandler.onMessage(message.getCommands());
                send(sGson.toJson(makeResult(message.getDevice(), result)));
            } catch (Exception e) {
                Log.e(TAG, "error: " + sGson.toJson(new Error(message.getDevice(), e.getMessage())));
                e.printStackTrace();
                send(sGson.toJson(new Error(message.getDevice(), e.getMessage())));
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
