# Chetbot server

## Dev setup

### Install dependencies

- `npm`
- `dyanmodb-local`

### Start dyanmodb-local on port 8000

    $ dyanmodb-local
    XXX:INFO:oejs.Server:jetty-8.1.12.v20130726
    XXX:INFO:oejs.AbstractConnector:Started SelectChannelConnector@0.0.0.0:8000

You might want to run this in a separate terminal or a `screen` session.

### Create an S3 bucket

- `chetbot.apps`

### Create an appetize.io account

Click [here](https://appetize.io/api) and enter your email address. You'll need the token sent to you by email.

### Create a GitHub app

Create a [new application](https://github.com/settings/applications/new) called "ChetBot" or something similar. Set the callback URL to `http://localhost:8001/auth/github/callback`.

Make a note of the client ID and client secret.

### Create debug config

- Copy `config/default.json` to `config/debug.json` and open `config/debug.json` in your favourite text editor.
- Set your S3 access key ID and secret access key in `"S3"`.
- Remove all the keys from `"dyanmodb"` and add `"endpoint"`, setting the value to `"http://localhost:8000"`.
- Set your appetize.io token in `"appetize_io"`.
- Set your client ID and client secret in `"github-oauth"` and set `"callbackURL"` to `"http://localhost:8001/auth/github/callback"`.

### Run the server

    $ NODE_ENV=debug node server.js
