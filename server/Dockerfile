FROM node:latest
MAINTAINER Chetan Padia

ADD . /opt/chetbot-server
VOLUME /opt/chetbot-server/config

WORKDIR /opt/chetbot-server

# TODO: install smali, baksmali
# TODO: run gen-smali.sh

RUN apt-get update
RUN apt-get -y install zip unzip default-jre-headless xmlstarlet
RUN wget https://xml-apk-parser.googlecode.com/files/APKParser.jar -o android/deps/APKParser.jar
RUN npm update

ENV PORT 8000
ENV NODE_ENV production

EXPOSE 8000

CMD npm start
