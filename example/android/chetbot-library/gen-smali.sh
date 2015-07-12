#!/bin/bash

# Fail on error
set -e

# Check output directory does not already exist
if [ -e "$1" ] ; then
  echo "$1 already exists";
  exit 1;
fi

# Change to the folder the script is in
CWD=$(pwd)
cd $(dirname "$0")

# Compile Java
../gradlew clean
../gradlew compileReleaseJava

# Find class files and dex them
cd build/intermediates/classes/release
find . -name "*.class" > classes.txt
dx --dex --verbose --input-list=classes.txt --output=classes.dex

# Generate smali
baksmali --output "${CWD}/$1" classes.dex
