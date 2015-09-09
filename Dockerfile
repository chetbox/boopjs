FROM node:latest
MAINTAINER Chetan Padia

# Fetch dependencies
RUN dpkg --add-architecture i386
RUN apt-get update && apt-get -y install wget zip unzip default-jdk xmlstarlet libc6:i386 libncurses5:i386 libstdc++6:i386 zlib1g:i386
RUN wget -qO- http://dl.google.com/android/android-sdk_r24.3.3-linux.tgz | tar -zx -C /opt/
RUN echo y | /opt/android-sdk-linux/tools/android update sdk --all --filter platform-tools,build-tools-22.0.1,android-21,extra-android-support,extra-android-m2repository --no-ui --force

# Setup Android tools environment
ENV PATH "$PATH:/opt/android-sdk-linux/build-tools/22.0.1"
ENV ANDROID_HOME /opt/android-sdk-linux/

# Add project
ADD scripts /opt/chetbot/scripts
ADD android /opt/chetbot/android
ADD server /opt/chetbot/server
WORKDIR /opt/chetbot/server
VOLUME /opt/chetbot/server/config

# Get project dependencies
RUN mkdir -p apps/android/deps
RUN curl -L https://xml-apk-parser.googlecode.com/files/APKParser.jar -o apps/android/deps/APKParser.jar
RUN curl -L https://bitbucket.org/JesusFreke/smali/downloads/smali-2.0.6.jar -o apps/android/deps/smali-2.0.6.jar
RUN curl -L https://bitbucket.org/JesusFreke/smali/downloads/baksmali-2.0.6.jar -o apps/android/deps/baksmali-2.0.6.jar
RUN curl -L https://bitbucket.org/iBotPeaches/apktool/downloads/apktool_2.0.1.jar -o apps/android/deps/apktool_2.0.1.jar

# Generate Android keystore
RUN mkdir -p /root/.android
RUN keytool -genkey -v -keystore /root/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android -dname CN=android -keyalg RSA -keysize 2048 -validity 36500

# Configure project
RUN npm install --unsafe-perm

# Generate code to inject into applications
RUN /opt/chetbot/scripts/gen-smali

# Run tests
RUN npm test

# Configure server
ENV NODE_ENV production
ENV PORT 80
EXPOSE 80

CMD npm start
