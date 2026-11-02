#!/usr/bin/env bash
set -euo pipefail

BUILD_ENV="/tmp/android-build-env"
mkdir -p "$BUILD_ENV"

echo "=== 1. Checking / Downloading Portable OpenJDK 21 ==="
if [ ! -x "$BUILD_ENV/jdk/bin/java" ]; then
  mkdir -p "$BUILD_ENV/jdk"
  curl -sSL "https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse?project=jdk" -o "$BUILD_ENV/jdk.tar.gz"
  tar -xzf "$BUILD_ENV/jdk.tar.gz" -C "$BUILD_ENV/jdk" --strip-components=1
  rm -f "$BUILD_ENV/jdk.tar.gz"
fi

export JAVA_HOME="$BUILD_ENV/jdk"
export PATH="$JAVA_HOME/bin:$PATH"
java -version

echo "=== 2. Checking / Downloading Android Command Line Tools ==="
export ANDROID_HOME="$BUILD_ENV/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
if [ ! -x "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]; then
  mkdir -p "$ANDROID_HOME/cmdline-tools"
  curl -sSL "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -o "$BUILD_ENV/cmdline-tools.zip"
  unzip -q "$BUILD_ENV/cmdline-tools.zip" -d "$ANDROID_HOME/cmdline-tools"
  mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
  rm -f "$BUILD_ENV/cmdline-tools.zip"
fi

export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "=== 3. Accepting Android SDK Licenses & Installing Platform 36 + Build Tools 35.0.0 ==="
yes | sdkmanager --licenses > /dev/null 2>&1 || true
sdkmanager "platform-tools" "platforms;android-36" "build-tools;35.0.0"

echo "=== 4. Preparing Release Upload Keystore ==="
APP_DIR="/app/applet"
ANDROID_DIR="$APP_DIR/android"
KEYSTORE_FILE="$ANDROID_DIR/trussets-upload-key.jks"
KEYSTORE_PROPS="$ANDROID_DIR/keystore.properties"

STORE_PASS="${ANDROID_KEYSTORE_PASSWORD:-Trussets@BrandOrigin2026}"
KEY_ALIAS="${ANDROID_KEY_ALIAS:-trussets-upload}"
KEY_PASS="${ANDROID_KEY_PASSWORD:-Trussets@BrandOrigin2026}"

if [ ! -f "$KEYSTORE_FILE" ]; then
  keytool -genkeypair -v \
    -storetype PKCS12 \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$STORE_PASS" \
    -keypass "$KEY_PASS" \
    -dname "CN=Trussets, OU=Mobile, O=Brand Origin, L=Hyderabad, ST=Telangana, C=IN"
fi

cat > "$KEYSTORE_PROPS" <<EOF
storeFile=$KEYSTORE_FILE
storePassword=$STORE_PASS
keyAlias=$KEY_ALIAS
keyPassword=$KEY_PASS
EOF

cat > "$ANDROID_DIR/local.properties" <<EOF
sdk.dir=$ANDROID_HOME
EOF

echo "=== 5. Syncing Capacitor & Running Gradle bundleRelease and assembleRelease ==="
cd "$APP_DIR"
if [ ! -f "$APP_DIR/dist/index.html" ]; then
  npm run build
fi
npx cap sync android

cd "$ANDROID_DIR"
chmod +x ./gradlew
./gradlew bundleRelease assembleRelease

echo "=== 6. Verifying Generated AAB & APK ==="
AAB_OUT="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
APK_OUT="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"

ls -lh "$AAB_OUT" "$APK_OUT"
jarsigner -verify -verbose -certs "$AAB_OUT" | head -n 25

mkdir -p "$APP_DIR/public/downloads"
cp "$AAB_OUT" "$APP_DIR/public/downloads/trussets-release.aab"
cp "$APK_OUT" "$APP_DIR/public/downloads/trussets-release.apk"

echo "=== BUILD COMPLETE ==="
ls -lh "$APP_DIR/public/downloads/trussets-release.aab" "$APP_DIR/public/downloads/trussets-release.apk"
