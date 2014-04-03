# Node.js on android

(main node repo)[https://github.com/joyent/node]

Looks like it probably has built-in support now for building on Android.

As of 20140402 latest stable version is 0.10.26
But this has quite a lot of android build issues that have been resolved in other version(s), e.g. master at this point which is 


```
git clone git://github.com/joyent/node.git
cd node
git checkout v0.10.26
```

might need
```
sudo apt-get install libbz2-dev
```

See also (android config script)[https://github.com/joyent/node/blob/master/android-configure]. Download/checkout and change toolchain (`arm-linux-androideabi-4.7`) and platform (`android-9`) depending on your version of the NDK, then:
```
source ./android-configure PATH_TO_ANDROID_NDK
```
try (assuming system python 2.6/2.7 including bz2)
```
mv android-toolchain/bin/python pythonlink
```
try (if complaint about arm_version)
```
export GYP_DEFINES="armv7=0 arm_version=7"
./configure \
    --without-snapshot \
    --dest-cpu=arm \
    --dest-os=android --without-ssl
```

## old notes...

v0.10.26

edit `config.gypi` and add `ANDROID=1` to 
```
'defines': [],
```
i.e.
```
'defines': ['ANDROID=1'],
```

(Do that instead of ./configure) Then continue build as normal:
```
make
```
If you get
```
../deps/cares/src/ares_expand_name.c:31:35: fatal error: arpa/nameser_compat.h: No such file or directory
```
Then edit `deps/cares/config/linux/ares_config.h` and change
```
#define HAVE_ARPA_NAMESER_COMPAT_H 1
```
to
```
/* #undef HAVE_ARPA_NAMESER_COMPAT_H 1 */
```

If you get
```
../deps/uv/include/uv-private/uv-unix.h:148:1: error: unknown type name 'pthread_barrier_t'
```
edit `deps/uv/include/uv-private/uv-unix.h` and change 
```
#if defined(__APPLE__) && defined(__MACH__)

typedef struct {
  unsigned int n;
  unsigned int count;
  uv_mutex_t mutex;
  uv_sem_t turnstile1;
  uv_sem_t turnstile2;
} uv_barrier_t;

#else /* defined(__APPLE__) && defined(__MACH__) */

typedef pthread_barrier_t uv_barrier_t;

#endif /* defined(__APPLE__) && defined(__MACH__) */
```
to 
```
#if (defined(__APPLE__) && defined(__MACH__)) || defined(__ANDROID__)
...
```
```
../deps/uv/src/unix/stream.c:746:16: error: 'IOV_MAX' undeclared (first use in this function)
```
near the top of `deps/uv/include/uv-private/uv-unix.h` add
```
#ifdef __ANDROID__
#define IOV_MAX 1024
#endif
```
if
```
../deps/uv/src/unix/thread.c:286:3: warning: implicit declaration of function 'pthread_condattr_setclock' [-Wimplicit-function-declaration]
   if (pthread_condattr_setclock(&attr, CLOCK_MONOTONIC))
   ^
../deps/uv/src/unix/thread.c: In function 'uv_barrier_init':
../deps/uv/src/unix/thread.c:412:3: warning: implicit declaration of function 'pthread_barrier_init' [-Wimplicit-function-declaration]
   if (pthread_barrier_init(barrier, NULL, count))
   ^
../deps/uv/src/unix/thread.c: In function 'uv_barrier_destroy':
../deps/uv/src/unix/thread.c:420:3: warning: implicit declaration of function 'pthread_barrier_destroy' [-Wimplicit-function-declaration]
   if (pthread_barrier_destroy(barrier))
   ^
../deps/uv/src/unix/thread.c: In function 'uv_barrier_wait':
../deps/uv/src/unix/thread.c:426:3: warning: implicit declaration of function 'pthread_barrier_wait' [-Wimplicit-function-declaration]
   int r = pthread_barrier_wait(barrier);
   ^
../deps/uv/src/unix/thread.c:427:17: error: 'PTHREAD_BARRIER_SERIAL_THREAD' undeclared (first use in this function)
   if (r && r != PTHREAD_BARRIER_SERIAL_THREAD)
                 ^
../deps/uv/src/unix/thread.c:427:17: note: each undeclared identifier is reported only once for each function it appears in
```
edit `deps/uv/src/unix/thread.c` and change several occurances (1st, 3rd, 5th) of 
```
#if defined(__APPLE__) && defined(__MACH__)
```
to 
```
#if (defined(__APPLE__) && defined(__MACH__)) || defined(__ANDROID__)
```

if
```
../deps/uv/src/unix/linux-core.c:46:22: fatal error: ifaddrs.h: No such file or directory
```
edit `deps/uv/src/unix/linux-core.c`. Before 
```
#ifdef HAVE_IFADDRS_H
# include <ifaddrs.h>
#endif
```
insert
```
#ifdef __ANDROID__
#  undef HAVE_IFADDRS_H
#endif
```

If
```
../deps/uv/src/unix/linux-syscalls.h:140:25: warning: 'struct timespec' declared inside parameter list [enabled by default]
```
then edit `deps/uv/src/unix/linux-syscalls.h`
insert 
```
#include <linux/time.h>
```

If 
```
ImportError: No module named bz2
```
try (assuming system python 2.6/2.7 including bz2)
```
mv android-toolchain/bin/python pythonlink
```

if
```
../deps/v8/src/platform-linux.cc:1206:13: error: 'SYS_tgkill' was not declared in this scope
```
ensure define `ANDROID=1` (see top)

if
```
../src/cares_wrap.cc:376:36: error: 'ns_c_in' was not declared in this scope
```
cares_wrap needs to include `deps/cares/include/nameser.h` (not default dummy header in toolchain)
edit `src/cares_wrap.cc`
```
#if defined(__OpenBSD__) || defined(__MINGW32__) || defined(_MSC_VER)
# include <nameser.h>
#else
# include <arpa/nameser.h>
#endif
```
to
```
#if defined(__ANDROID__) || defined(__OpenBSD__) || defined(__MINGW32__) || defined(_MSC_VER)
...
```

if
```
../src/node.cc: In function 'uid_t node::uid_by_name(const char*)':
```
edit `src/node.cc` replace 
```
```
with 
```
```

## Older (node 0.8) versions

one framework based on 0.8 for running node with various additional supports:

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

ndk-build


general arm cross-compile (pi)

- https://gist.github.com/adammw/3245130

versions using debiankit/similar to build on android directly

- http://sven-ola.dyndns.org/repo/debian-kit-en.html
- http://masashi-k.blogspot.co.uk/2013/08/nodejs-on-android.html
- http://mitchtech.net/node-js-on-android-linux/




