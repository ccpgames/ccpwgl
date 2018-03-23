import {emitter} from './Tw2EventEmitter';
import {Tw2Resource} from '../resource/Tw2Resource';
import {Tw2ObjectReader} from '../reader/Tw2ObjectReader';

/**
 * Manages loaded resources
 * @property {Object} _loadedObjects
 * @constructor
 */
function Tw2MotherLode()
{
    this._loadedObjects = {};

    /**
     * Finds a loaded object by it's file path
     * @param {string} path
     * @returns {Tw2LoadingObject}
     */
    this.Find = function(path)
    {
        if (path in this._loadedObjects)
        {
            return this._loadedObjects[path];
        }
        return null;
    };

    /**
     * Adds a loaded object
     * @param {string} path
     * @param {Tw2LoadingObject} obj
     */
    this.Add = function(path, obj)
    {
        this._loadedObjects[path] = obj;
    };

    /**
     * Removes a loaded object by it's file path
     * @param {string} path
     */
    this.Remove = function(path)
    {
        delete this._loadedObjects[path];
    };

    /**
     * Clears the loaded object object
     */
    this.Clear = function()
    {
        this._loadedObjects = {};
    };

    /**
     * Unloads all loaded objects and then clears the loadedObject object
     */
    this.UnloadAndClear = function()
    {
        for (var path in this._loadedObjects)
        {
            if (this._loadedObjects.hasOwnProperty(path))
            {
                this._loadedObjects[path].Unload();
            }
        }
        this._loadedObjects = {};
    };

    /**
     * Purges inactive loaded objects (resources that have been loaded but are not being actively used)
     * - Loaded objects can flagged with `doNotPurge` to ensure they are never removed
     * - Resource auto purging can be managed in `ccpwgl` or `ccpwgl_int.resMan` - {@link Tw2ResMan}
     *     ccpwgl.setResourceUnloadPolicy()
     *     ccpwgl_int.resMan.autoPurgeResources=true
     *     ccpwgl_int.resMan.purgeTime=30
     * @param {Number} curFrame - the current frame count
     * @param {Number} frameLimit - how many frames the object can stay alive for before being purged
     * @param {Number} frameDistance - how long the resource has been alive for
     */
    this.PurgeInactive = function(curFrame, frameLimit, frameDistance)
    {
        for (var path in this._loadedObjects)
        {
            if (this._loadedObjects.hasOwnProperty(path))
            {
                var obj = this._loadedObjects[path];
                if (!obj.doNotPurge)
                {
                    if (obj._isPurged)
                    {
                        emitter.log('res.event',
                            {
                                msg: 'Unloaded  ',
                                path: obj.path,
                                type: 'purged'
                            });

                        delete this._loadedObjects[path];
                    }
                    if (obj._isGood && (curFrame - obj.activeFrame) % frameLimit >= frameDistance)
                    {
                        if (obj.Unload())
                        {
                            emitter.log('res.event',
                                {
                                    msg: 'Unloaded  ',
                                    path: obj.path,
                                    type: 'unused'
                                });
                            delete this._loadedObjects[path];
                        }
                    }
                }
            }
        }
    };
}

/**
 * Tw2LoadingObject
 * @property {object} object
 * @property {string} _redContents - object's .red file xml contents
 * @property {Number} _inPrepare
 * @property {Array.<Object>} _objects
 * @property {Tw2ObjectReader} _constructor
 * @property {function} _constructorFunction - The constructor used to create the object once it's red contents have loaded
 * @inherit Tw2Resource
 * @class
 */
export class Tw2LoadingObject extends Tw2Resource
{
    constructor()
    {
        super();
        this.object = null;
        this._redContents = null;
        this._inPrepare = null;
        this._objects = [];
        this._constructor = null;
        this._constructorFunction = null;
    }
}

/**
 * AddObject
 * @param {Object} object
 * @param {Function} callback
 * @param {Boolean} initialize
 * @returns {Boolean}
 */
Tw2LoadingObject.prototype.AddObject = function(object, callback, initialize)
{
    object._loadCallback = callback;
    object._initialize = initialize;
    this._objects.push(object);
    return false;
};

/**
 * Prepare
 * @param text
 */
Tw2LoadingObject.prototype.Prepare = function(text)
{
    if (text === null)
    {
        emitter.log('res.error',
            {
                log: 'error',
                src: ['Tw2LoadingObject', 'Prepare'],
                msg: 'Invalid XML',
                path: this.path,
                type: 'xml.invalid',
            });
        this.PrepareFinished(false);
        return;
    }

    if (this._inPrepare === null)
    {
        this._redContents = text;
        this._constructor = new Tw2ObjectReader(this._redContents);
        this._constructorFunction = null;
        this._inPrepare = 0;
    }

    while (this._inPrepare < this._objects.length)
    {
        try
        {
            this._objects[this._inPrepare]._loadCallback(this._constructor.Construct());
        }
        catch (e)
        {
            emitter.log('res.error',
                {
                    log: 'error',
                    src: ['Tw2LoadingObject', 'Prepare'],
                    msg: 'Error preparing resource',
                    path: this.path,
                    type: 'prepare',
                    err: e
                });
        }

        this._inPrepare++;
    }

    resMan.motherLode.Remove(this.path);

    emitter.log('res.event',
        {
            msg: 'Prepared  ',
            path: this.path,
            type: 'prepared'
        });

    this.PrepareFinished(true);
};


/**
 * Resource Manager
 * @property {Boolean} systemMirror - Toggles whether {@link GeometryResource} Index and Buffer data arrays are visible
 * @property {Object.<string, string>} resourcePaths
 * @property {Object} resourcePaths.res - Default resource path for current ccpwgl version
 * @property {Object.<string, Function>} _extensions - an object of registered extensions and their constructors
 * @property {Tw2MotherLode} motherLode
 * @property {Number} maxPrepareTime
 * @property {Number} prepareBudget
 * @property {Array} _prepareQueue
 * @property {Boolean} autoPurgeResources=true - Sets whether resources should be purged automatically
 * @property {Number} purgeTime=30 = Sets how long resources can remain inactive before they are purged
 * @property {Number} activeFrame
 * @property {Number} _purgeTime
 * @property {Number} _purgeFrame
 * @property {Number} _purgeFrameLimit
 * @property {Number} _pendingLoads - a count of how many things are pending load
 * @property {Number} _noLoadFrames
 * @constructor
 */
function Tw2ResMan()
{
    this.motherLode = new Tw2MotherLode();

    this.systemMirror = false;
    this.maxPrepareTime = 0.05;
    this.prepareBudget = 0;
    this.autoPurgeResources = true;
    this.activeFrame = 0;
    this.purgeTime = 30;

    this._extensions = {};
    this._resourcePaths = {};
    this._constructors = {};
    this._missingConstructors = [];

    this._prepareQueue = [];
    this._purgeTime = 0;
    this._purgeFrame = 0;
    this._purgeFrameLimit = 1000;
    this._pendingLoads = 0;
    this._noLoadFrames = 0;

    /**
     * IsLoading
     * @returns {Boolean}
     *
     */
    this.IsLoading = function()
    {
        return this._noLoadFrames < 2;
    };

    /**
     * Creates an Http request
     * @returns {XMLHttpRequest|ActiveXObject}
     * @private
     */
    this._CreateHttpRequest = function()
    {
        var httpRequest = null;

        if (window.XMLHttpRequest)
        {
            // Mozilla, Safari, ...
            httpRequest = new XMLHttpRequest();
        }
        else if (window.ActiveXObject)
        {
            // IE
            try
            {
                httpRequest = new window['ActiveXObject']('Msxml2.XMLHTTP');
            }
            catch (e)
            {
                try
                {
                    httpRequest = new window['ActiveXObject']('Microsoft.XMLHTTP');
                }
                catch (e)
                {}
            }
        }

        if (!httpRequest)
        {
            emitter.log('res.error',
                {
                    log: 'error',
                    src: ['Tw2LoadingObject', 'Prepare'],
                    msg: 'Could not create an XMLHTTP instance',
                    type: 'http.instance'
                });
        }
        return httpRequest;
    };

    /**
     * Normalizes a file path by making it lower case and replaces all '\\' with '/'
     * @param {string} path
     * @returns {string}
     * @private
     */
    function _NormalizePath(path)
    {
        if (path.substr(0, 5) === 'str:/')
        {
            return path;
        }
        path = path.toLowerCase();
        path.replace('\\', '/');
        return path;
    }

    /**
     * _GetPathExt
     * @param path
     * @returns {string}
     * @private
     */
    function _GetPathExt(path)
    {
        if (path.substr(0, 5) === 'str:/')
        {
            var slash = path.indexOf('/', 5);
            if (slash === -1)
            {
                return null;
            }
            return path.substr(5, slash - 5);
        }
        else
        {
            var dot = path.lastIndexOf('.');
            if (dot === -1)
            {
                return null;
            }
            return path.substr(dot + 1);
        }
    }

    /**
     * Returns a path suitable for logging by truncating really long file names
     * @param {string} path
     * @returns {string}
     */
    this.LogPathString = function(path)
    {
        if (path.substr(0, 5) === 'str:/' && path.length > 64)
        {
            return path.substr(0, 64) + '...';
        }
        return path;
    };

    /**
     * Internal update function. It is called every frame.
     * @param {Number} dt - deltaTime
     * @returns {Boolean}
     */
    this.PrepareLoop = function(dt)
    {
        if (this._prepareQueue.length === 0 && this._pendingLoads === 0)
        {
            if (this._noLoadFrames < 2)
            {
                this._noLoadFrames++;
            }
        }
        else
        {
            this._noLoadFrames = 0;
        }

        resMan.prepareBudget = resMan.maxPrepareTime;

        var startTime = Date.now();
        var now;

        while (resMan._prepareQueue.length)
        {
            try
            {
                var result = resMan._prepareQueue[0][0].Prepare(resMan._prepareQueue[0][1], resMan._prepareQueue[0][2]);
            }
            catch (e)
            {
                resMan._prepareQueue.shift();
                throw e;
            }
            if (!result)
            {
                now = Date.now();

                emitter.log('res.event',
                    {
                        msg: 'Prepared  ',
                        path: resMan._prepareQueue[0][0].path,
                        time: (now - startTime) * 0.001,
                        type: 'prepared'
                    });

                resMan._prepareQueue.shift();
            }

            now = Date.now();
            resMan.prepareBudget -= (now - startTime) * 0.001;

            if (resMan.prepareBudget < 0)
            {
                break;
            }
        }

        this._purgeTime += dt;

        if (this._purgeTime > 1)
        {
            this.activeFrame += 1;
            this._purgeTime -= Math.floor(this._purgeTime);
            this._purgeFrame += 1;

            if (this._purgeFrame >= 5)
            {
                if (this.autoPurgeResources)
                {
                    this.motherLode.PurgeInactive(this._purgeFrame, this._purgeFrameLimit, this.purgeTime);
                }
            }
        }

        return true;
    };

    /**
     * _DoLoadResource
     * @param obj
     * @private
     */
    function _DoLoadResource(obj)
    {
        return function()
        {
            var readyState = 0;

            try
            {
                readyState = this.readyState;
            }
            catch (e)
            {
                emitter.log('res.error',
                    {
                        log: 'error',
                        src: ['Tw2ResMan', '_DoLoadResource'],
                        msg: 'Communication error loading',
                        path: obj.path,
                        type: 'http.readystate',
                        value: readyState
                    });

                obj.LoadFinished(false);
                resMan._pendingLoads--;
                return;
            }

            if (readyState === 4)
            {
                if (this.status === 200)
                {
                    obj.LoadFinished(true);
                    var data = null;
                    var xml = null;

                    try
                    {
                        data = this.responseText;
                        xml = this.responseXML;
                    }
                    catch (e)
                    {
                        data = this.response;
                    }

                    resMan._prepareQueue.push([obj, data, xml]);
                }
                else
                {
                    emitter.log('res.error',
                        {
                            log: 'error',
                            src: ['Tw2ResMan', '_DoLoadResource'],
                            msg: 'Communication error loading',
                            path: obj.path,
                            type: 'http.status',
                            value: this.status
                        });
                    obj.LoadFinished(false);
                }
                resMan._pendingLoads--;
            }
        };
    }

    /**
     * Builds a url from a resource path
     * - the prefix in the resource path is replaced with it's string value from `this._resourcePaths`
     * @param {string} resPath
     * @returns {string}
     */
    this.BuildUrl = function(resPath)
    {
        var prefixIndex = resPath.indexOf(':/');
        if (prefixIndex === -1)
        {
            emitter.log('res.error',
                {
                    log: 'warn',
                    src: ['Tw2ResMan', 'BuildUrl'],
                    msg: 'Invalid path',
                    type: 'prefix.undefined',
                    path: resPath
                });
            return resPath;
        }

        var prefix = resPath.substr(0, prefixIndex);

        if (!(prefix in this._resourcePaths))
        {
            emitter.log('res.error',
                {
                    log: 'warn',
                    src: ['Tw2ResMan', 'BuildUrl'],
                    msg: 'Unregistered path',
                    path: resPath,
                    type: 'prefix.unregistered',
                    value: prefix
                });
            return resPath;
        }

        return this._resourcePaths[prefix] + resPath.substr(prefixIndex + 2);
    };

    /**
     * _LoadResource
     * @param obj
     * @returns {*}
     * @private
     */
    this._LoadResource = function(obj)
    {
        obj._isPurged = false;
        var path = obj.path;
        this.motherLode.Add(path, obj);

        if (('DoCustomLoad' in obj) && obj.DoCustomLoad(path))
        {
            return obj;
        }

        var httpRequest = this._CreateHttpRequest();
        httpRequest.onreadystatechange = _DoLoadResource(obj);

        emitter.log('res.event',
            {
                msg: 'Requesting',
                path: path,
                type: 'request'
            });

        httpRequest.open('GET', this.BuildUrl(path));

        if (obj.requestResponseType)
        {
            httpRequest.responseType = obj.requestResponseType;
        }

        obj.LoadStarted();

        try
        {
            httpRequest.send();
            this._pendingLoads++;
        }
        catch (e)
        {
            emitter.log('res.error',
                {
                    log: 'error',
                    src: ['Tw2ResMan', '_LoadResource'],
                    msg: 'Error requesting',
                    path: path,
                    type: 'http.request',
                    err: e
                });
        }
    };

    /**
     * Reloads a specific resource
     * @param {Tw2LoadingObject} resource
     * @returns {Tw2LoadingObject} resource
     */
    this.ReloadResource = function(resource)
    {
        var path = resource.path;

        emitter.log('res.event',
            {
                msg: 'Reloading ',
                path: path,
                type: 'reload'
            });

        var obj = this.motherLode.Find(path);

        if (obj !== null && !obj.IsPurged())
        {
            return obj;
        }

        this._LoadResource(resource);
        return resource;
    };

    /**
     * Gets a resource
     * @param {String} path
     * @returns resource
     */
    this.GetResource = function(path)
    {
        var obj;

        path = _NormalizePath(path);
        obj = this.motherLode.Find(path);

        if (obj !== null)
        {
            if (obj.IsPurged())
            {
                obj.Reload();
            }
            return obj;
        }

        var ext = _GetPathExt(path);

        if (ext === null)
        {
            emitter.log('res.error',
                {
                    log: 'error',
                    src: ['Tw2ResMan', 'ReloadResource'],
                    msg: 'Undefined extension',
                    type: 'extension.undefined',
                    path: this.LogPathString(path)
                });
            return null;
        }

        if (!(ext in this._extensions))
        {
            emitter.log('res.error',
                {
                    log: 'error',
                    src: ['Tw2ResMan', 'ReloadResource'],
                    msg: 'Unregistered extension',
                    type: 'extension.unregistered',
                    path: this.LogPathString(path),
                    value: ext
                });
            return null;
        }

        obj = new this._extensions[ext]();
        obj.path = path;
        this._LoadResource(obj);
        return obj;
    };

    /**
     * Gets an object (with initialization)
     * @param {string} path
     * @param {Function} callback
     */
    this.GetObject = function(path, callback)
    {
        this._GetObject(path, callback, true);
    };

    /**
     * Gets an object (without initialization)
     * @param {string} path
     * @param {Function} callback
     */
    this.GetObjectNoInitialize = function(path, callback)
    {
        this._GetObject(path, callback, false);
    };

    /**
     * Core function for managing the processing and loading of an object
     * @param {string} path
     * @param {Function} callback
     * @param {Boolean} initialize
     * @private
     */
    this._GetObject = function(path, callback, initialize)
    {
        path = _NormalizePath(path);

        var obj = {};
        var res = this.motherLode.Find(path);

        if (res !== null)
        {
            res.AddObject(obj, callback, initialize);
            return;
        }

        res = new Tw2LoadingObject();
        res.path = path;
        res.AddObject(obj, callback, initialize);

        this.motherLode.Add(path, res);

        var httpRequest = this._CreateHttpRequest();
        httpRequest.onreadystatechange = _DoLoadResource(res);

        emitter.log('res.event',
            {
                msg: 'Requesting',
                path: this.BuildUrl(path),
                _path: path,
                type: 'requesting'
            });

        httpRequest.open('GET', this.BuildUrl(path));
        httpRequest.responseType = 'arraybuffer';
        res.LoadStarted();
        obj._objectLoaded = false;

        try
        {
            httpRequest.send();
            this._pendingLoads++;
        }
        catch (e)
        {
            emitter.log('res.error',
                {
                    log: 'error',
                    src: ['Tw2ResMan', '_GetObject'],
                    msg: 'Error sending object HTTP request',
                    path: this.BuildUrl(path),
                    _path: path,
                    type: 'http.request',
                    err: e
                });
        }
    };

    /**
     * Clears the motherLode {@link Tw2MotherLode}
     */
    this.Clear = function()
    {
        this.motherLode.Clear();
    };

    /**
     * Unloads and Clears the motherLode {@link Tw2MotherLode}
     */
    this.UnloadAndClear = function()
    {
        this.motherLode.UnloadAndClear();
    };

    /**
     * Passes key:values from an object or array of objects to an internal function
     * @param {*} target
     * @param {string} funcName
     * @param {Array|{}} obj
     * @returns {boolean}
     */
    const _toKeyValue = function(target, funcName, obj)
    {
        if (obj && funcName && funcName in target)
        {
            obj = Array.isArray(obj) ? obj : [obj];
            for (let i = 0; i < obj.length; i++)
            {
                for (let key in obj[i])
                {
                    if (obj[i].hasOwnProperty(key))
                    {
                        target[funcName](key, obj[i][key]);
                    }
                }
            }
            return true;
        }
        return false;
    };

    /**
     * Registers a library constructor
     * @param {string} name
     * @param {function} Constructor
     * @returns {?Function}}
     */
    this.RegisterConstructor = function(name, Constructor)
    {
        if (name && Constructor && typeof Constructor === 'function')
        {
            this._constructors[name] = Constructor;
            return Constructor;
        }
        return null;
    };

    /**
     * Registers library constructors from an object or array of objects
     * @param obj
     */
    this.RegisterConstructors = function(obj)
    {
        _toKeyValue(this, 'RegisterConstructor', obj);
    };

    /**
     * Gets a library constructor by name
     * @param {string} name
     * @param {boolean} [skipDebug]
     * @returns {?Function}
     */
    this.GetConstructor = function(name, skipDebug)
    {
        if (name && name in this._constructors)
        {
            return this._constructors[name];
        }
        else if (name && !skipDebug)
        {
            if (this._missingConstructors.indexOf(name) === -1)
            {
                this._missingConstructors.push(name);
            }

            if (name.includes('Tw2'))
            {
                return this.GetConstructor(name.replace('Tw2', 'Tr2'), true);
            }
            else if (name.includes('Tr2'))
            {
                return this.GetConstructor(name.replace('Tr2', 'Tw2'), true);
            }
        }
        return null;
    };

    /**
     * Registers extension's and their constructors
     * @param {string} extension
     * @param {Function} Constructor
     * @returns {boolean}
     */
    this.RegisterExtension = function(extension, Constructor)
    {
        if (!extension || !Constructor || typeof Constructor !== 'function')
        {
            return false;
        }

        this._extensions[extension] = Constructor;
        return true;
    };

    /**
     * Registers extensions from an object or array of objects
     * @param obj
     */
    this.RegisterExtensions = function(obj)
    {
        _toKeyValue(this, 'RegisterExtension', obj);
    };

    /**
     * Gets a resource constructor from it's extension
     * @param {string} extension
     * @returns {?Function}}
     */
    this.GetExtension = function(extension)
    {
        return extension && extension in this._extensions ? this._extensions[extension] : null;
    };

    /**
     * Registers a resource path
     * @param {string} prefix
     * @param {Function} path
     * @returns {boolean}
     */
    this.RegisterResourcePath = function(prefix, path)
    {
        if (!prefix || !path)
        {
            return false;
        }

        this._resourcePaths[prefix] = path;
        return true;
    };

    /**
     * Registers resource paths from an object or array of objects
     * @param obj
     */
    this.RegisterResourcePaths = function(obj)
    {
        _toKeyValue(this, 'RegisterResourcePath', obj);
    };

    /**
     * Gets a resource path from its prefix
     * @param {string} prefix
     * @returns {?string}}
     */
    this.GetResourcePath = function(prefix)
    {
        return prefix && prefix in this._resourcePaths ? this._resourcePaths[prefix] : null;
    };

    /**
     * Register
     * @param {{}} opt
     * @param {{}} opt.resMan
     * @param {boolean} opt.systemMirror
     * @param {boolean} opt.autoPurgeResources
     * @param {number} opt.autoPurgeTimer
     * @param {{}} opt.resourcePaths
     * @param {{}} opt.extensions
     * @param {{}} opt.constructors
     */
    this.Register = function(opt)
    {
        if (opt)
        {
            this.RegisterConstructors(opt.constructors);
            this.RegisterResourcePaths(opt.resourcePaths);
            this.RegisterExtensions(opt.extensions);
        }
    };
}

// Global instance of Tw2ResMan
export const resMan = new Tw2ResMan();
