# Node.js on android

Working notes on building Node.js into an Android app.

## Node itself

(main node repo)[https://github.com/joyent/node]

Looks like it probably has built-in support now for building on Android.

As of 20140402 latest stable version is v0.10.26. But this has quite a lot of android build issues that have been resolved in other version(s), e.g. master at this point which is something like v0.11.12. 


```
git clone git://github.com/joyent/node.git
cd node
git checkout v0.10.26
```

See also (android config script)[https://github.com/joyent/node/blob/master/android-configure]. Download/checkout and change toolchain (`arm-linux-androideabi-4.7`) and platform (`android-9`) depending on your version of the NDK, then:
```
source ./android-configure PATH_TO_ANDROID_NDK
```
try (assuming system python 2.6/2.7 including bz2)
```
rm android-toolchain/bin/python
```
try (if complaint about arm_version)
```
export GYP_DEFINES="armv7=0 arm_version=7"
./configure \
    --without-snapshot \
    --dest-cpu=arm \
    --dest-os=android --without-ssl
```

This node executable builds and runs on android (for me). 

## NPM and packages for android

(some notes in a comment)[http://n8.io/cross-compiling-nodejs-v0.8/]:
```
aqpeeb • a year ago
As far as npm goes, here's what I found works (for me) cross compiling for arm. My host machine is a x86-64, my target an armv7. I built node as-per instructions here and elsewhere. Now I want to build node packages (like sqlite3) that require a compiler:

# my npm built for the host machine, not the target!
NPM := $(STAGING_DIR_HOST)/bin/npm
# where to put node_modules
$(NPM) config set prefix $(1)/usr
# the target arch
$(NPM) config set target_arch arm
# $(2) is the package I want to install (ie. sqlite3)
# TARGET_CONFIGURE_OPTS and MAKE_VARS are the CC, CXX, LD, AR, etc and CFLAGS, etc that you use to build target executables, the cross toolchain
$(TARGET_CONFIGURE_OPTS) $(MAKE_VARS) $(NPM) install -g $(2)
# and finally, I also had to:
mv $(1)/usr/lib/node_modules $(1)/usr/lib/node

The "config set" of prefix and target_arch are key, as well as the CC, CXX, CFLAGS, etc env you need to set up before calling npm.
```

## socket.io

Doesn't build with the above using regular npm. For a start regular npm is stable, i.e. 0.10.x and has lots of problems in general with Android cross-compiling, and socket.io has a dependency on (ws)[https://github.com/einaros/ws] which has two native files which therefore don't build. There was also a problem with CFLAGS including -m64 which produces an error with ARM cross-compiler.

Native bits of node packages are building using (node-gyp)[https://github.com/TooTallNate/node-gyp], which in turn is a node application and typically installed with npm. So presumably I'll need to build an up-to-date version of node and npm for the host (not target) machine. 

See also (gyp user docs)[https://code.google.com/p/gyp/wiki/GypUserDocumentation].

(socket.io)[https://github.com/LearnBoost/socket.io], depends on:
- (engine.io)[]
- (socket.io-parser)[]
- (socket.io-client)[], which depends on 
```
  "engine.io-client": "1.0.5",
    "emitter": "http://github.com/component/emitter/archive/1.0.1.tar.gz",
    "bind": "http://github.com/component/bind/archive/0.0.1.tar.gz",
    "object-component": "0.0.3",
    "socket.io-parser": "2.1.2",
    "parseuri": "0.0.2",
    "to-array": "0.1.3",
    "debug": "0.7.4",
    "has-binary-data": "0.1.0",
    "indexof": "0.0.1"
```
- (socket.io-adapter)[]
- (has-binary-data)[]
- (debug)[https://github.com/visionmedia/debug]

## See also

versions using debiankit/similar to build on android directly

- http://sven-ola.dyndns.org/repo/debian-kit-en.html
- http://masashi-k.blogspot.co.uk/2013/08/nodejs-on-android.html
- http://mitchtech.net/node-js-on-android-linux/

## Node as an Android Library

one framework (based on v0.6) for running node with various additional supports:

- https://github.com/paddybyers/anode
- https://github.com/paddybyers/node
- from https://github.com/joyent/node

try ndk setup (don't have platform-10):
```
~/android/android-ndk-r9c/build/tools/make-standalone-toolchain.sh     --toolchain=arm-linux-androideabi-4.8     --arch=arm     --install-dir=$TOOLCHAIN     --platform=android-12
export PATH=/home/pszcmg/android/paddybyers/android-toolchain/bin:$PATH
rm android-toolchain/bin/python
```

following (anode build instructions)[https://github.com/paddybyers/anode/wiki/Build]

```
git clone git://github.com/paddybyers/openssl-android.git
cd openssl-android
```
Edit `jni/Application.mk` and change `NDK_TOOLCHAIN_VERSION=4.4.3` to a toolchain in your NDK (e.g. `4.6`)
```
~/android/android-ndk-r9c/ndk-build
```
```
git clone git://github.com/paddybyers/anode.git
git clone git://github.com/paddybyers/pty.git
git clone git://github.com/paddybyers/node.git
```
```
cd anode
~/android/android-ndk-r9c/ndk-build NDK_PROJECT_PATH=. NDK_APPLICATION_MK=Application.mk
cp libs/armeabi/libjninode.so ./app/assets/
cp libs/armeabi/bridge.node ./app/assets/
```
Download (jtar)[https://code.google.com/p/jtar/downloads/detail?name=jtar-1.0.4.jar&can=2&q=] to `anode/app/lib` (create the directory).

Apparently:
- Open Eclipse and do: File->Import->General->Existing projects into workspace
- Point to the <work dir>/anode directory and import the app, libnode and bridge-java projects.
- In app Properties > Android add the libnode project as a library
- build and run

OK. But all rather complicated - I'm not really after native Java module support.



