FROM node:latest
MAINTAINER Chetan Padia

# Fetch dependencies
RUN dpkg --add-architecture i386
RUN apt-get update && apt-get -y install wget zip unzip default-jdk xmlstarlet libc6:i386 libncurses5:i386 libstdc++6:i386 zlib1g:i386
RUN wget -qO- http://dl.google.com/android/android-sdk_r24.3.4-linux.tgz | tar -zx -C /opt/
RUN echo y | /opt/android-sdk-linux/tools/android update sdk --all --filter platform-tools,build-tools-23.0.1,android-23,extra-android-support,extra-android-m2repository --no-ui --force

# Setup Android tools environment
ENV PATH "$PATH:/opt/android-sdk-linux/build-tools/23.0.1"
ENV ANDROID_HOME /opt/android-sdk-linux/

# Get project dependencies
ADD https://xml-apk-parser.googlecode.com/files/APKParser.jar \
    https://bitbucket.org/JesusFreke/smali/downloads/smali-2.1.0.jar \
    https://bitbucket.org/JesusFreke/smali/downloads/baksmali-2.1.0.jar \
    https://bitbucket.org/iBotPeaches/apktool/downloads/apktool_2.0.1.jar \
    /opt/chetbot/server/apps/android/deps/

# Generate Android keystore
RUN mkdir -p /root/.android
RUN keytool -genkey -v -keystore /root/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android -dname CN=android -keyalg RSA -keysize 2048 -validity 36500

# Node server configuration
ENV NODE_ENV production
ENV PORT 80
EXPOSE 80
WORKDIR /opt/chetbot/server
CMD npm start

# Add project
ADD . /opt/chetbot
VOLUME /opt/chetbot/server/config

# Configure project
RUN npm install --unsafe-perm

# Generate code to inject into applications
RUN /opt/chetbot/scripts/gen-smali

# Run tests
RUN npm test
