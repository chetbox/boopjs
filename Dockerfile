FROM chetbox/android-sdk:23.0.1
MAINTAINER chetbox

# Install Node
RUN wget -qO- https://deb.nodesource.com/setup_4.x | bash -
RUN apt-get install -y git nodejs && \ # Bower uses git
    apt-get autoremove -y && \
    apt-get clean all

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
