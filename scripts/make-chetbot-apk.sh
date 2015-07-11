#!/bin/bash

if [ ! -f "$1" ] ; then
  echo "File not found: $1"
  exit 1;
fi

# fail on error
set -e

file=$(basename "$1")
extension="${file##*.}"
filename="${file%.*}"
outfilename="${filename}-chetbot.${extension}"

tmp_dir=/tmp/make_chetbot_apk
rm -rf "$tmp_dir" # make sure there's no junk lying around
mkdir -p "$tmp_dir"

echo "Copying APK"
echo "  $1"
cp "$1" "${tmp_dir}/app.apk"

echo "Copying ChetBot sources"
cp -r chetbot-smali "${tmp_dir}/"

echo "Extracting classes.dex"
unzip -p "${tmp_dir}/app.apk" classes.dex > "${tmp_dir}/classes.dex"

echo "Decompiling"
baksmali -x "${tmp_dir}/classes.dex" -o "${tmp_dir}/app-smali" > /dev/null

echo "Finding main activity"
main_activity=$(java -jar APKParser.jar "${tmp_dir}/app.apk" | \
                xml sel -t -v "/manifest/application/activity[intent-filter/category/@android:name='android.intent.category.LAUNCHER' and intent-filter/action/@android:name='android.intent.action.MAIN']/@android:name")
echo "  $main_activity"

main_activity_smali="${tmp_dir}/app-smali/$(echo $main_activity | sed 's#\.#/#g').smali"
if [ ! -f "$main_activity_smali" ] ; then
  >&2 echo "Error: Could not find code for main activity (${main_activity_smali})"
  exit 1
fi

echo "Injecting Chetbot"
cp -R chetbot-smali/* "${tmp_dir}/app-smali/"

echo "TODO: launch chetbot on LAUNCHER activity"
echo "Please add the following code manually to ${main_activity_smali} and press Enter"
echo "    invoke-static {p0}, Lcom/chetbox/chetbot/android/Chetbot;->start(Landroid/app/Activity;)V"
read

echo "Recompiling"
rm "${tmp_dir}/classes.dex"
smali "${tmp_dir}/app-smali" -o "${tmp_dir}/classes.dex" > /dev/null

echo "Updating APK"
zip -j "${tmp_dir}/app.apk" "${tmp_dir}/classes.dex"

echo "Removing old signing info"
zip -d "${tmp_dir}/app.apk" "META-INF/*"

echo "Signing"
jarsigner \
  -digestalg SHA1 \
  -sigalg MD5withRSA \
  -keystore ~/.android/debug.keystore \
  -storepass android \
  -keypass android \
  "${tmp_dir}/app.apk" \
  androiddebugkey
jarsigner -verify -certs "${tmp_dir}/app.apk"

echo "Zip-aligning"
zipalign 4 "${tmp_dir}/app.apk" "${tmp_dir}/app-aligned.apk"

echo "Cleaning up"
cp "${tmp_dir}/app-aligned.apk" "${outfilename}"
rm -r "${tmp_dir}"

echo "Created ${outfilename}"
