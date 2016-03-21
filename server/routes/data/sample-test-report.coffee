module.exports =
  app:
    icon: '/images/slack-icon.png'
    platform: 'android'
    version: '2.0.2'
    os_version: '5.1'
    pending_report: false
    id: '644EaVSw5'
    updated_at: 1454947801973
    name: 'Slack'
    identifier: 'com.Slack'
  started_at: 1456505569936
  error:
    source: 'wait_for(\'This does not appear\');'
    description: 'Timeout expired (10s) (https://boopjs.com/device/android.js#334)'
    line: 39
    stacktrace: 'lgzmrmbhly.org.mozilla.javascript.JavaScriptException: Timeout expired (10s) (https://boopjs.com/device/android.js#334)\n\tat lgzmrmbhly.org.mozilla.javascript.Interpreter.interpretLoop(Interpreter.java:1018)\n\tat script.wait_for(https://boopjs.com/device/android.js:334)\n\tat script(edit:39)\n\tat lgzmrmbhly.org.mozilla.javascript.Interpreter.interpret(Interpreter.java:815)\n\tat lgzmrmbhly.org.mozilla.javascript.InterpretedFunction.call(InterpretedFunction.java:109)\n\tat lgzmrmbhly.org.mozilla.javascript.ContextFactory.doTopCall(ContextFactory.java:393)\n\tat lgzmrmbhly.org.mozilla.javascript.ScriptRuntime.doTopCall(ScriptRuntime.java:3282)\n\tat lgzmrmbhly.org.mozilla.javascript.InterpretedFunction.exec(InterpretedFunction.java:120)\n\tat lgzmrmbhly.org.mozilla.javascript.Context.evaluateString(Context.java:1219)\n\tat lgzmrmbhly.com.chetbox.chetbot.android.Chetbot.onStatement(Chetbot.java:185)\n\tat lgzmrmbhly.com.chetbox.chetbot.android.ChetbotServerConnection$ServerConnectionImpl.onMessage(ChetbotServerConnection.java:185)\n\tat lgzmrmbhly.org.java_websocket.client.WebSocketClient.onWebsocketMessage(WebSocketClient.java:312)\n\tat lgzmrmbhly.org.java_websocket.WebSocketImpl.decodeFrames(WebSocketImpl.java:368)\n\tat lgzmrmbhly.org.java_websocket.WebSocketImpl.decode(WebSocketImpl.java:157)\n\tat lgzmrmbhly.org.java_websocket.client.WebSocketClient.interruptableRun(WebSocketClient.java:230)\n\tat lgzmrmbhly.org.java_websocket.client.WebSocketClient.run(WebSocketClient.java:188)\n\tat java.lang.Thread.run(Thread.java:818)\n'
  report: [
    null
    {
      source: 'function sign_in(team, email, password) {\n    tap(\'Sign in\');\n    wait_for(\'team domain\');\n    type_text(team);\n    tap(\'Continue\');\n    wait_for(\'Your email address\');\n    type_text(email);\n    tap(\'Continue\');\n    tap(\'password\');\n    type_text(password);\n    tap(\'Continue\');\n    wait_for(team);\n}'
      success: [ Object ]
    }
    null
    null
    null
    null
    null
    null
    null
    null
    null
    null
    null
    null
    null
    null
    null
    null
    null
    {
      source: 'function open_conversation(conversation_name) {\n    tap(\'Jump to\\u2026\');\n    type_text(conversation_name);\n    wait(1);\n    tap(bottommost(conversation_name));\n}'
      success: [ Object ]
    }
    null
    null
    null
    null
    null
    {
      source: 'function send_message(message) {\n    tap(\'Type a message\');\n    type_text(message);\n    tap({ id: \'message_send_btn\' });\n    hide_keyboard();\n}'
      success: [ Object ]
    }
    null
    null
    null
    null
    null
    null
    {
      source: 'sign_in(\'chetbot\', \'chetbot@chetbox.com\', \'myweakpassword\');'
      success: [ Object ]
    }
    {
      source: 'screenshot();'
      success: result:
        type: 'BITMAP'
        uri: 'https://i.imgur.com/AL7fDGu.png'
    }
    null
    {
      source: 'open_conversation(\'binary-solo\');'
      success: [ Object ]
    }
    null
    {
      source: 'send_message(\'Hey! I\\\'m sending this from the Slack Android app using boop.js\');'
      success: [ Object ]
    }
    null
    {
      error:
        source: 'wait_for(\'This does not appear\');'
        description: 'Timeout expired (10s) (https://boopjs.com/device/android.js#334)'
        stacktrace: 'lgzmrmbhly.org.mozilla.javascript.JavaScriptException: Timeout expired (10s) (https://boopjs.com/device/android.js#334)\n\tat lgzmrmbhly.org.mozilla.javascript.Interpreter.interpretLoop(Interpreter.java:1018)\n\tat script.wait_for(https://boopjs.com/device/android.js:334)\n\tat script(edit:39)\n\tat lgzmrmbhly.org.mozilla.javascript.Interpreter.interpret(Interpreter.java:815)\n\tat lgzmrmbhly.org.mozilla.javascript.InterpretedFunction.call(InterpretedFunction.java:109)\n\tat lgzmrmbhly.org.mozilla.javascript.ContextFactory.doTopCall(ContextFactory.java:393)\n\tat lgzmrmbhly.org.mozilla.javascript.ScriptRuntime.doTopCall(ScriptRuntime.java:3282)\n\tat lgzmrmbhly.org.mozilla.javascript.InterpretedFunction.exec(InterpretedFunction.java:120)\n\tat lgzmrmbhly.org.mozilla.javascript.Context.evaluateString(Context.java:1219)\n\tat lgzmrmbhly.com.chetbox.chetbot.android.Chetbot.onStatement(Chetbot.java:185)\n\tat lgzmrmbhly.com.chetbox.chetbot.android.ChetbotServerConnection$ServerConnectionImpl.onMessage(ChetbotServerConnection.java:185)\n\tat lgzmrmbhly.org.java_websocket.client.WebSocketClient.onWebsocketMessage(WebSocketClient.java:312)\n\tat lgzmrmbhly.org.java_websocket.WebSocketImpl.decodeFrames(WebSocketImpl.java:368)\n\tat lgzmrmbhly.org.java_websocket.WebSocketImpl.decode(WebSocketImpl.java:157)\n\tat lgzmrmbhly.org.java_websocket.client.WebSocketClient.interruptableRun(WebSocketClient.java:230)\n\tat lgzmrmbhly.org.java_websocket.client.WebSocketClient.run(WebSocketClient.java:188)\n\tat java.lang.Thread.run(Thread.java:818)\n'
      source: 'wait_for(\'This does not appear\');'
    }
    null
    { source: 'assert_visible(\'Hey! I\\\'m sending this from the Slack Android app using boop.js\');' }
  ]
  code_id: 'W4CYKwqShc'
