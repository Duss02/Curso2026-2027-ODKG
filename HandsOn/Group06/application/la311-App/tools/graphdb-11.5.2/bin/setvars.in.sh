#!/bin/bash

SCRIPT="$0"

# SCRIPT may be an arbitrarily deep series of symlinks. Loop until we have the concrete path.
while [ -h "$SCRIPT" ] ; do
  ls=`ls -ld "$SCRIPT"`
  # Drop everything prior to ->
  link=`expr "$ls" : '.*-> \(.*\)$'`
  if expr "$link" : '/.*' > /dev/null; then
    SCRIPT="$link"
  else
    SCRIPT=`dirname "$SCRIPT"`/"$link"
  fi
done

# graphdb dist directory
GDB_DIST=`dirname "$SCRIPT"`/..

# make GDB_DIST absolute
GDB_DIST=`cd "$GDB_DIST"; pwd`

if [ -d "$GDB_DIST/jdk" ]; then
    # Our bundled JDK
    JAVA="$GDB_DIST/jdk/bin/java"
elif [ ! -z "$JAVA_HOME" ]; then
    JAVA="$JAVA_HOME/bin/java"
else
    JAVA=`which java`
fi

if [ ! -f "$JAVA" ]; then
   echo "Could not find Java binary. Please install Java in your PATH or set JAVA_HOME"
   exit 1
fi

GDB_CLASSPATH="$GDB_DIST/lib/*"

# Supported Java versions
SUPPORTED_JAVA_VERSION=21

set -o pipefail
JAVA_VERSION=$("$JAVA" -version 2>&1 | grep -E '^(openjdk|java) version' | awk 'sub(/^[^"]+"|"[^"]+$/, "") && gsub(/^1\.|\..+|".+/, "")')
if [ $? -eq 126 ]; then
    echo "Found Java binary in $JAVA but it's not executable, check your Java installation"
    exit 1
fi
if [ ! $? -eq 0 -o -z "$JAVA_VERSION" ]; then
    echo "Unable to determine Java version, check that $JAVA is actually a Java binary"
    exit 1
fi
set +o pipefail

if [[ "$JAVA_VERSION" -lt "$SUPPORTED_JAVA_VERSION" ]]; then
    echo "This GraphDB distribution requires Java $SUPPORTED_JAVA_VERSION or greater but you have Java $JAVA_VERSION"
    exit 1
fi

# Array of Java version-specific options to be used for both tools and GDB
JAVA_VERSION_OPTS=()

# Include Java exports for Java 9+
JAVA_VERSION_OPTS+=(--add-exports jdk.management.agent/jdk.internal.agent=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED
--enable-native-access=ALL-UNNAMED)

# By default the -XX:MaxDirectMemorySize is limited to the heap size
if [ "$GDB_JAVA_32BIT" != "true" ]; then
	JAVA_VERSION_OPTS+=("-XX:MaxDirectMemorySize=128G")
fi

source "`dirname "$0"`/graphdb.in.sh"
source "`dirname "$0"`/env-vars.in.sh"

call_java() {
    "$JAVA" "${JAVA_OPTS_ARRAY[@]}" $GDB_JAVA_OPTS -Dgraphdb.dist="$GDB_DIST" -cp "$GDB_CLASSPATH" "$@"
}
