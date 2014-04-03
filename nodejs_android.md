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

See also (android config script)[https://github.com/joyent/node/blob/master/android-configure]. Change toolchain (`arm-linux-androideabi-4.7`) and platform (`android-9`) depending on your version of the NDK:
```
export TOOLCHAIN=$PWD/android-toolchain
mkdir -p $TOOLCHAIN
<NDK_PATH>/build/tools/make-standalone-toolchain.sh \
    --toolchain=arm-linux-androideabi-4.7 \
    --arch=arm \
    --install-dir=$TOOLCHAIN \
    --platform=android-9
export PATH=$TOOLCHAIN/bin:$PATH
export AR=arm-linux-androideabi-ar
export CC=arm-linux-androideabi-gcc
export CXX=arm-linux-androideabi-g++
export LINK=arm-linux-androideabi-g++
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
    --dest-os=android --without-ssl --prefix=<NODE_ARM_DIR>
make
make install
```

This node executable builds and runs on android (for me). 

Probably build a native version as well for npm, etc.. I.e. with clear environment
```
./configure --prefix=<NODE_NATIVE_DIR>
make
make install
```

This should be the version of node to use for build tools, e.g. npm, node-gyp. So lets try adding <NODE_NATIVE_DIR>/bin to PATH. 

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
Not working for me at the moment (on ws, dependency of socket.io, below)...
But that may be optional!!

Native bits of node packages are building using (node-gyp)[https://github.com/TooTallNate/node-gyp], which in turn is a node application and typically installed with npm. So presumably I'll need to build an up-to-date version of node and npm for the host (not target) machine. 

node-gyp has option `--nodedir`. 

Building host node from git, `./configure`. Option `--prefix=PATH`, defaults `/usr/local`. Then `make`. Configure creates `config.gypi` which should have the platform-specific gyp configuration which node-gyp should look for. So we also need node configured for android.

using npm with unstable node release requires explicit --nodedir=... flag.
May also need to move asign built-in python gyp, try
```
$ python -c 'import gyp; print gyp.__file__'
```
move python package dir if found and following giving error.
```
npm install --nodedir=/home/pszcmg/android/node ws
```
NB nodedir is a node git source directory, not an install directory.
Now looks like standard nan.h header from nan module isn't consistent (node_modules/ws/builderrors.log)...
```
../node_modules/nan/nan.h:319:38: error: ‘New’ is not a member of ‘v8::String’
 # define _NAN_ERROR(fun, errmsg) fun(v8::String::New(errmsg))
                                      ^
```
maybe try specific nan, e.g. 
```
git clone https://github.com/rvagg/nan.git
npm install ./nan/
```

Still failing - maybe nan changes??
```
../src/bufferutil.cc: In static member function ‘static void BufferUtil::Initialize(v8::Handle<v8::Object>)’:
../src/bufferutil.cc:27:58: error: no matching function for call to ‘v8::FunctionTemplate::New(void (&)(const v8::FunctionCallbackInfo<v8::Value>&))’
```

Really unclear whether version(s) of nan are compatible with version(s) of node and version(s) of ws. 
But may not matter as ws native parts don't actually seem to be required at the moment.

See also (gyp user docs)[https://code.google.com/p/gyp/wiki/GypUserDocumentation].


## socket.io

Not quite sure what has changed but seems ok-ish now.

Probably best using the new node/npm, i.e. add their install dir to the PATH, then:
```
npm install socket.io
```

Simple test e.g. (here)[http://socket.io/#how-to-use]

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



