package com.chetbox.chetbot.android;

import android.util.Log;

import com.google.gson.Gson;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import java.net.URI;

public class ChetbotServerConnection extends WebSocketClient {

    public interface MessageHandler {
        Object onMessage(Command[] message) throws IllegalArgumentException;
    }

    public static class Message {
        private String device;
        private Command[] commands;

        public Command[] getCommands() {
            return commands.clone();
        }
    }

    public static class Result {
        private Object result;

        public Result(Object result) {
            this.result = result;
        }
    }

    private static final String TAG = ChetbotServerConnection.class.getSimpleName();

    private static Gson sGson = new Gson();

    private final MessageHandler mMessageHandler;

    public ChetbotServerConnection(MessageHandler messageHandler) {
        super(URI.create("ws://ec2-54-77-127-243.eu-west-1.compute.amazonaws.com"));
        mMessageHandler = messageHandler;
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
    public void onMessage(String messageStr) {
        Log.v(TAG, "Message received: " + messageStr);
        Message message = sGson.fromJson(messageStr, Message.class);
        Object result = mMessageHandler.onMessage(message.getCommands());
        send(sGson.toJson(new Result(result)));
    }

    @Override
    public void onError(Exception e) {
        e.printStackTrace();
    }
}
