FROM node:latest
MAINTAINER Chetan Padia

ADD . /opt/chetbot-server
VOLUME /opt/chetbot-server/config

WORKDIR /opt/chetbot-server

RUN apt-get update
RUN apt-get install zip unzip
RUN npm install

ENV PORT 8000
ENV NODE_ENV production

EXPOSE 8000

CMD npm start
