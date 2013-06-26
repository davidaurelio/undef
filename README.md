# undef – builder for AMD JavaScript projects

*undef* is a builder for AMD based JavaScript projects. It strips `define`
calls from the source files and combines all modules into a single file.

**undef is alpha software and not yet ready for use in production systems.**


## Installation

undef can be installed with **npm.**

```sh
npm install -g undef
```


## Current Capabilities and Limitations

undef can currently build a project of AMD modules, where each module is in an
own file, and each file contains only the module definition (`define(…);`).
Source comments are ok. Only anonymous modules are supported at the moment.

There is no support for the special dependencies “require”, “module” and
“exports” yet.


## Usage

### Basic invocation
Uses “entry/module” as entry point and resolves all dependencies. The resulting
source code is written to stdout.

```
undef entry/module
```


### Options
* **-d/--basedir DIR** – the base path to use for module resolution. Defaults
  to the current working directory.

* **-p/--paths PATHS** – paths for individual modules. Accepts a comma-separated
  list of mappings, e.g. `-paths=foo=else/where,bar/baz=somewhere/else`. **Paths
  are resolved relative to the current working directory, not to --basedir.**
  This is different from require.js.

* **-o/--output FILE** write output to this file instead of stdout.


## Plans and TODOs

* Expose a usable API for common functionality.
* Support multiple modules per file (and in consequence, named modules).
* Support special “require”, “module” and “exports” dependencies.
* Simplified CommonJS wrapping.
* Pre-load files containing module definitions.
* Post-process **r.js** builds – useful for buildable plugins like “text”.
* Pass the amd test suite as far as possible (using a special browser build).


## Not In Scope

The following things are not in the scope of this project:

* Minification – just pipe through the minifier of your choice.
* AMD plugin support – this will be covered by processing r.js builds.
