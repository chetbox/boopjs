FROM node:latest
MAINTAINER Chetan Padia

# Fetch dependencies
RUN dpkg --add-architecture i386
RUN apt-get update
RUN apt-get -y install wget zip unzip default-jdk xmlstarlet
RUN wget -qO- http://dl.google.com/android/android-sdk_r24.3.3-linux.tgz | tar -zx -C /opt/
RUN echo y | /opt/android-sdk-linux/tools/android update sdk --all --filter platform-tools,build-tools-22.0.1 --no-ui --force
RUN apt-get -y install libc6:i386 libncurses5:i386 libstdc++6:i386 zlib1g:i386

# Make Android build tools available to $PATH
ENV PATH "$PATH:/opt/android-sdk-linux/build-tools/22.0.1"

# Add project
ADD . /opt/chetbot-server
WORKDIR /opt/chetbot-server
VOLUME /opt/chetbot-server/config

# Get project dependencies
RUN mkdir -p android/deps
RUN wget -q https://xml-apk-parser.googlecode.com/files/APKParser.jar -O android/deps/APKParser.jar
RUN wget -q https://bitbucket.org/JesusFreke/smali/downloads/smali-2.0.6.jar -O android/deps/smali.jar
RUN wget -q https://bitbucket.org/JesusFreke/smali/downloads/baksmali-2.0.6.jar -O android/deps/baksmali.jar

# Generate Android keystore
RUN mkdir -p /root/.android
RUN keytool -genkey -v -keystore /root/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android -dname CN=android -keyalg RSA -keysize 2048 -validity 36500

# TODO: run gen-smali.sh

# Configure project
RUN npm update
ENV NODE_ENV production
ENV PORT 80
EXPOSE 80

CMD npm start
