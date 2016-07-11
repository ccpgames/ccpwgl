CCP WebGL Library
======

Building
------

Building ccpwgl requires [Node.js](http://www.nodejs.org) and [Grunt](http://www.gruntjs.com) installed.
After installing, run ```npm install``` once, which downloads the dependencies.

If you are on Windows you will also need to install the Grunt CLI globally with ```npm install -g grunt-cli```.

When all is set up, ```grunt [task]``` starts the build script.

The default task runs the tasks "cc", "format", "min". "lint" is currently not in the
chain for still reporting too many errors.

**Available tasks**:
* format: running jsbeautifier (based on .jsbeautifyrc)
* lint: running jshint (based on .jshintrc)
* cc: Creates an unminified ccpwgl initialisation file (`/dist/ccpwgl_int.js`)
* min: Creates a minified ccpwgl initialisation file (`/dist/ccpwgl_int.min.js`)
* gl3: Creates the ccpwgl glMatrix files (`/dist/ccpwgl_gl3.js` and `/dist/ccpwgl_gl3.min.js`)
* dist: Creates all distribution files (running `min` , `cc` and `gl3`)

Documentation (Work in progress)
--------------------------------
The following command line will create jsdoc html documentation in the `/docs` folder
* > `jsdoc -c .jsdocs -d docs` (Windows users will need to add jsdocs to their path variables)
