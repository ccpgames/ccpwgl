CCP WebGL Library
======

Building
------

Building ccpwgl requires [Node.js](http://www.nodejs.org) and [Grunt](http://www.gruntjs.com) installed.
After installing, run ```npm install``` once, which downloads the dependencies.

If you are on Windows you will also need to install the Grunt CLI globally with ```npm install -g grunt-cli```.

When all is set up, ```grunt [task]``` starts the build script.

The default task runs the tasks "format" and "compile". "lint" is currently not in the
chain for still reporting too many errors.

Available tasks:
* format: running jsbeautifier (based on .jsbeautifyrc)
* lint: running jshint (based on .jshintrc)
* compile: running uglifyjs, producing ccpwgl_int.js