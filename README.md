# boop.js web

Source code for boopjs.com - a place for scripting Android apps in the cloud.

###### Example: Testing search in the [JustEat app](https://play.google.com/store/apps/details?id=com.justeat.app.uk)
<img src="examples/JustEat%20-%20Search.gif?raw=true"/>

[More examples](examples/)

## Setup

```shell
cp server/config/default.json server/config/debug.json
```

Edit `server/config/debug.json` and supply the necessary information. You will need keys for:
- A GitHub app
- Amazon S3
- Amazon DyanmoDB
- Appetize.io

(Optional) You can run a local version of DynamoDB instead of one hosted by Amazon by installing `dynamodb-local` and using it in your config with no authentication like so:

```json
  "dynamodb": {
    "endpoint": "http://localhost:8000"
  }
```

Create a docker image

```shell
docker build . -t chetbot
```

## How to run

Run a container with the docker image you just created, making your configuratin available as a volume and make the HTTP port accessible on `8080`:

```shell
docker run -e NODE_ENV=debug -v $PWD/server/config:/opt/chetbot/server/config -p 8080:80 -d chetbot
```

Then point your browser at http://localhost:8080
