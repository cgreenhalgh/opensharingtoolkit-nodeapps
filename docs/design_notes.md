# OST NodeApps Design Notes

## Node Execution

For now I will just run node as a sub-process. The build executable will be bundled with assets and extracted to private app data to run. Exec framework will be from HotSpot code base.

A single group activity will be supported by a single node instance running a particular node package (or file).

The runner app will monitor standard out/error. There will be standard command line arguments for compliant node apps:

- magic string/interface version identifier, initially "--opensharingtoolkit-nodeapp-0.1"
- control port - to connect back to as a secure control/logging channel 
- persistent instance ID  

The control/logging protocol will comprise JSON-encoded values, newline separated, over TCP. Exact details TBD. Messages emitted by node should include:

- application hello, including app, version, protocol information
- incompatible prototype error (followed by shutdown)
- client connection URL(s) (and metadata)
- log events
- planned shutdown (activity end) announcement

The persistent instance ID will allow the node process to access a specific persistent store for preserving state between invocations and the "same" activity (e.g. across crashes/restarts). It might be a file path for a sqlite database.

There may be some other form of shared state/coordination between apps, but that is currently undefined.

Normally a node app on start-up should:

- check magic/version for compatibility 
- connect back to control port
- if not compatible send error and exit
- send hello
- start client-accessed services - http, socket.io
- send client connection url(s)
- run...
- when activity over, send planned shutdown and exit


## Node App Packaging

This is just my summary of the relevant information node/commonjs module/packaging information - see the references for the real specifications and more details.

Node's loading of modules is descibed in the (module api documentation)[http://nodejs.org/api/modules.html].

An app will be organised as a node module package, i.e. a set of files/folders including a top-level package.json file (spec)[http://wiki.commonjs.org/wiki/Packages/1.1], i.e. object with at least:

- `name` - name of package/nodeapp
- `version` - version in `MAJOR.MINOR.PATCH` (format)[http://semver.org/], where MAJOR changes are incompatible, MINOR changes are backward compatible and PATCH changes are nominally all compatible.
- `main` - relative name of main module (usually javascript file) to load 

(If there is no package.json then node falls back to attempting to load `index.js` (javascript) then `index.node` (binary addon) from that directory, but this means that no metadata is available. Similarly a single javascript files can be loaded/required but again there is no standard metadata.)

Other common elements include: `maintainers`, `description`, `licenses`, `repositories`, `contributors`, `dependencies`, `homepage`, `engine`, `scripts` - see (spec)[http://wiki.commonjs.org/wiki/Packages/1.1].

Standard subdirectories are:

- `bin` - any binary files - no initial support
- `lib` - javascript code
- `doc` - documentation
- `test` - unit tests

Node's standard require handling will treat module names starting `/` as absolute file/directory paths, and starting `./` or `../` as relative file/directory paths. Other names will be searched for in `node_modules` sub-directories of ancestor directories of the current module (file). Note that it will NOT search beyond the top-most `node_modules` ancestor (if there is one), i.e. installed modules won't load dependencies that are not also installed with or above them.

By default it appears that npm installs module dependencies within the module that declares them (i.e. within a `node_modules` sub-cirectory), although if they are already present at a higher level (e.g. explicitly installed) then they are skipped.

### Implications for NodeApps

So node should get the full file path of the nodeapp module (i.e. package directory) as its command-line argument. Any modules required by it (and its dependencies) will have to be (a) relative references also including in the current place or (b) modules present under `node_modules` directories in its ancestors.

So if npm is used to pull in dependencies then it would save space if common dependencies are installed first and explicitly under a common higher-level folder.

So by default we will copy a `node_modules` directory hierarchy onto the apps `files` area, and identify the module for node to run using its absolute path (which will be within that directory).  

### Marking NodeApps

It would probably be useful to mark out compliant apps. This is mainly down to command-line and control channel expectations. Some options are listed below but none is currently specified.

We could create a standard support module which nodeapps should/must use and declare as a dependency. Bit authoritarian although probably reasonable in practice.

We could use a keyword in package.json to hint compliance, e.g.
```
  "keywords": [ "opensharingtoolkit-nodeapp" ],
```

NPM defines config properties in package.json which might also be used to hint, e.g.
```
  "config": { "opensharingtoolkit-nodeapp-version": "0.1" }
```

The package 1.1 specification defines a package.json field `overlay` which is an Object hash of replacement top-level properties. Unknown fields are meant to be ignored so we could single a compatible app with something like:
```
  "overlay": {
    "opensharingtoolkit-nodeapp": { ... }
  }
```

## Application Functionality

The hosting application will use a foreground service to start and monitor the node instance(s). The first version may only run one node instance at a time.

The hosting application will identify potential node apps by searching the `node_modules` directory. It may also use a keyword hint, to filter potential modules as above. Several different apps may be installed. There may (in principle) be several different instances of an app running at once. There may also be several different saved (non-running) persistent 'instances' (i.e. states). 

For an instance (running or persistent) there will be a control/status activity which will:
- show current run state
- show if persistent
- allow activity to be started/stopped
- allow persistent activity to be removed
- give access to diagnostic output (events, stdout/stderr) (separate activities)
- give access to client state list (separate activity), including current clients and available client options (may open in separate activities, with URL and QRCode)

There will be an activity listing current (running or persistent) instances with summary status (e.g. sub-sections?)

There will be an activity listing and allowing selection of a particular `node_module`, for starting a new instance

There will be an activity for configuring a new instance request, initially whether persistent.

There may be a global settings activity (not sure).

There will be a top-level menu activity, with links to instance list activity, new instance dialog and any general settings.

Eventually there will activities for updating node apps, i.e. automatic download.


