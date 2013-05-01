function Tw2MotherLode()
{
    this._loadedObjects = {};

    this.Find = function (path)
    {
        if (path in this._loadedObjects)
        {
            return this._loadedObjects[path];
        }
        return null;
    };

    this.Add = function (path, obj)
    {
        this._loadedObjects[path] = obj;
    };
    
    this.Remove = function (path)
    {
        delete this._loadedObjects[path];
    };
    
    this.Clear = function ()
    {
        this._loadedObjects = {};
    };
    
    this.PurgeInactive = function (curFrame, frameLimit, frameDistance)
    {
        for (var path in this._loadedObjects)
        {
            var obj = this._loadedObjects[path];
            if (!obj.doNotPurge)
            {
                if (obj._isPurged)
                {
                    console.log('Removed purged resource ', obj.path);
                    delete this._loadedObjects[path];
                }
                if (obj._isGood && (curFrame - obj.activeFrame) % frameLimit >= frameDistance)
                {
                    if (obj.Unload())
                    {
                        console.info('Unloaded unused resource ', obj.path);
                        delete this._loadedObjects[path];
                    }
                }
            }
        }
    };
}

function Tw2LoadingObject()
{
	this._super.constructor.call(this);
    this.object = null;
	this._redContents = null;
	this._inPrepare = null;
	this._objects = [];
}

Tw2LoadingObject.prototype.AddObject = function (object, callback, initialize)
{
	object._loadCallback = callback;
    object._initialize = initialize;
	this._objects.push(object);
	return false;
};

Tw2LoadingObject.prototype.Prepare = function (text, xml)
{
    if (xml == null)
    {
        console.error('Invalid XML for object ' + this.path);
        this.PrepareFinished(false);
        return;
    }
    if (this._inPrepare === null)
    {
        this._redContents = xml;

        this._constructor = new Tw2ObjectReader(this._redContents);
        this._constructorFunction = null;

        this._inPrepare = 0;
    }

    while (this._inPrepare < this._objects.length)
    {
        if (!this._constructorFunction)
        {
            var initialize = this._objects[this._inPrepare]._initialize;
            this._constructorFunction = this._constructor.Construct(initialize);
        }
        if (!this._constructorFunction())
        {
            return true;
        }

        this._constructorFunction = null;
        this._objects[this._inPrepare]._loadCallback(this._constructor.result);
        this._inPrepare++;
    }
    resMan.motherLode.Remove(this.path);
    console.info('Prepared ' + this.path);
    this.PrepareFinished(true);
};

Inherit(Tw2LoadingObject, Tw2Resource);

function Tw2ResMan()
{
    this.resourcePaths = {};
    this.resourcePaths['res'] = 'res/';
    
    this._extensions = {};
    this.motherLode = new Tw2MotherLode();
    this.maxPrepareTime = 0.05;
    this.prepareBudget = 0;
    this._prepareQueue = [];
    this.autoPurgeResources = true;
    this.activeFrame = 0;
    this._purgeTime = 0;
    this._purgeFrame = 0;
    this._purgeFrameLimit = 1000;
    this.purgeTime = 30;
    this._pendingLoads = 0;
    this._noLoadFrames = 0;
    
    
    this.IsLoading = function ()
    {
        return this._noLoadFrames < 2;
    };

    this.RegisterExtension = function (extension, constructor)
    {
        this._extensions[extension] = constructor;
    };

    this._CreateHttpRequest = function ()
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
                httpRequest = new ActiveXObject("Msxml2.XMLHTTP");
            }
            catch (e)
            {
                try
                {
                    httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
                }
                catch (e)
                {
                }
            }
        }

        if (!httpRequest)
        {
            console.error('ResMan:',' could not create an XMLHTTP instance');
        }
        return httpRequest;
    };

    function _NormalizePath(path)
    {
        if (path.substr(0, 5) == 'str:/')
        {
            return path;
        }
        path = path.toLowerCase();
        path.replace('\\', '/');
        return path;
    }
    
    function _GetPathExt(path)
    {
        if (path.substr(0, 5) == 'str:/')
        {
            var slash = path.indexOf('/', 5);
            if (slash == -1)
            {
                return null;
            }
            return path.substr(5, slash - 5);
        }
        else
        {
            var dot = path.lastIndexOf('.');
            if (dot == -1)
            {
                return null;
            }
            return path.substr(dot + 1);
        }
    }
    
    this.LogPathString = function (path)
    {
        if (path.substr(0, 5) == 'str:/' && path.length > 64)
        {
            return path.substr(0, 64) + '...';
        }
        return path;
    };

    this.PrepareLoop = function (dt)
    {
        if (this._prepareQueue.length == 0 && this._pendingLoads == 0)
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

        var now = new Date();
        var startTime = now.getTime();
        var preparedCount = 0;
        while (resMan._prepareQueue.length)
        {
            if (!resMan._prepareQueue[0][0].Prepare(resMan._prepareQueue[0][1], resMan._prepareQueue[0][2]))
            {
                var now = new Date();
                console.info('Prepared ', resMan._prepareQueue[0][0].path, ' in ', (now.getTime() - startTime) * 0.001, ' secs');
                resMan._prepareQueue.shift();
                preparedCount++;
            }
            var now = new Date();
            resMan.prepareBudget -= (now.getTime() - startTime) * 0.001;
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

    function _DoLoadResource(obj)
    {
        return function ()
        {
            readyState = 0;
            try
            {
                readyState = this.readyState;
            }
            catch (e)
            {
                console.error('ResMan:',' communication error when loading  \"', obj.path, '\" (readyState ', readyState, ')');
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
                    console.error('ResMan:', ' communication error when loading  \"', obj.path, '\" (code ', this.status, ')');
                    obj.LoadFinished(false);
                }
                resMan._pendingLoads--;
            }
        };
    }

    this.BuildUrl = function(resPath)
    {
        var prefixIndex = resPath.indexOf(':/');
        if (prefixIndex == -1)
        {
            console.error('ResMan:', ' invalid resource path: \"', resPath, '\"');
            return resPath;
        }
        
        var prefix = resPath.substr(0, prefixIndex);
        if (!(prefix in this.resourcePaths))
        {
            console.error('ResMan:', ' invalid resource path: \"', resPath, '\"');
            return resPath;
        }
        return this.resourcePaths[prefix] + resPath.substr(prefixIndex + 2);
    };
    
    this._LoadResource = function (obj)
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
        console.info('Requesting \"', this.BuildUrl(path), '\"');
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
            console.error('ResMan:', ' error sending resource HTTP request: ', e.toString());
        }
    };
    
    this.ReloadResource = function (resource)
    {
        var path = resource.path;
        console.info('ResMan:', 'reloading resource ', path);
        var obj = this.motherLode.Find(path);
        if (obj !== null && !obj.IsPurged())
        {
            return obj;
        }
        this._LoadResource(resource);
        return resource;
    };

    this.GetResource = function (path)
    {
        path = _NormalizePath(path);

        var obj = this.motherLode.Find(path);
        if (obj !== null)
        {
            if (obj.IsPurged())
            {
                obj.Reload();
            }
            return obj;
        }

        var ext = _GetPathExt(path);
        if (ext == null)
        {
            console.error('ResMan:', ' unknown extension for path ', this.LogPathString(path));
            return null;
        }
        if (!(ext in this._extensions))
        {
            console.error('ResMan:', ' unregistered extension  ', ext);
            return null;
        }
        var obj = new this._extensions[ext]();
        obj.path = path;
        this._LoadResource(obj);
        return obj;
    };

    this.GetObject = function (path, callback)
    {
        this._GetObject(path, callback, true);
    };

    this.GetObjectNoInitialize = function (path, callback)
    {
        this._GetObject(path, callback, false);
    };

    this._GetObject = function (path, callback, initialize)
    {
        path = _NormalizePath(path);

        var obj = null;
        obj = {};

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
        console.info('Requesting \"', this.BuildUrl(path), '\"');
        httpRequest.open('GET', this.BuildUrl(path));
        res.LoadStarted();
        obj._objectLoaded = false;
        try
        {
            httpRequest.send();
            this._pendingLoads++;
        }
        catch (e)
        {
            console.error('ResMan:', ' error sending object HTTP request: ', e.toString());
        }
    };
    
    this.Clear = function ()
    {
        this.motherLode.Clear();
    };
}

var resMan = new Tw2ResMan();