#!/bin/bash

if [ ! -f "$1" ] ; then
  echo "File not found: $1"
  exit 1;
fi

# fail on error
set -e

cwd="$PWD"
file=$(basename "$1")
extension="${file##*.}"
filename="${file%.*}"
outfilename="${filename}-chetbot.${extension}"

tmp_dir=/tmp/make_chetbot_apk
rm -rf "$tmp_dir" # make sure there's no junk lying around
mkdir -p "$tmp_dir"

outfile_unaligned="${tmp_dir}/${filename}.unaligned.chetbot.${extension}"

echo "Copying APK"
cp "$1" "${tmp_dir}/app.apk"

echo "Copying ChetBot sources"
cp -r chetbot-smali "${tmp_dir}/"

cd "${tmp_dir}"

echo "Extracting classes.dex"
unzip -p app.apk classes.dex > classes.dex

echo "Decompiling"
baksmali -x classes.dex -o app-smali

echo "Injecting Chetbot"
cp -R chetbot-smali/* app-smali/

echo "TODO: launch chetbot on LAUNCHER activity"
echo "Please add the following code manually in $tmp_dir/app-smali and press Enter"
echo "    invoke-static {p0}, Lcom/chetbox/chetbot/android/Chetbot;->start(Landroid/app/Activity;)V"
read

echo "Recompiling"
rm classes.dex
smali app-smali -o classes.dex

echo "Modifying APK"
zip app.apk classes.dex

echo "Removing old signing info"
zip -d app.apk "META-INF/*"

echo "Signing"
jarsigner \
  -digestalg SHA1 \
  -sigalg MD5withRSA \
  -keystore ~/.android/debug.keystore \
  -storepass android \
  -keypass android \
  app.apk \
  androiddebugkey
jarsigner -verify -certs app.apk

echo "Zip-aligning"
zipalign 4 app.apk app-aligned.apk

echo "Cleaning up"
cp app-aligned.apk "${cwd}/${outfilename}"
cd "${cwd}"
rm -r "${tmp_dir}"

echo "Created ${outfilename}"
