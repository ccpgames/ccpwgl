import {store} from './Tw2Store';
import {Tw2MotherLode} from './Tw2MotherLode';
import {Tw2LoadingObject} from '../../core/resource/Tw2LoadingObject';
import {Tw2EventEmitter} from '../../core/Tw2EventEmitter';
import {
    Tw2Error,
    ErrHTTPInstance,
    ErrHTTPReadyState,
    ErrHTTPRequestSend,
    ErrHTTPStatus,
    ErrFeatureNotImplemented,
    ErrResourceExtensionUndefined,
    ErrResourceExtensionUnregistered,
    ErrResourcePrefixUndefined,
    ErrResourcePrefixUnregistered
} from '../../core';
import {assignIfExists} from '../util';


/**
 * Resource Manager
 *
 * @property {Tw2MotherLode} motherLode
 * @property {Boolean} systemMirror - Toggles whether {@link Tw2GeometryRes} Index and Buffer data arrays are visible
 * @property {Number} maxPrepareTime
 * @property {Boolean} autoPurgeResources=true - Sets whether resources should be purged automatically
 * @property {Number} purgeTime=30 = Sets how long resources can remain inactive before they are purged
 * @property {Number} activeFrame
 * @property {Number} _prepareBudget
 * @property {Array} _prepareQueue
 * @property {Number} _purgeTime
 * @property {Number} _purgeFrame
 * @property {Number} _purgeFrameLimit
 * @property {Number} _pendingLoads - a count of how many things are pending load
 * @property {Number} _noLoadFrames
 * @class
 */
export class Tw2ResMan extends Tw2EventEmitter
{

    motherLode = new Tw2MotherLode();
    systemMirror = false;
    maxPrepareTime = 0.05;
    autoPurgeResources = true;
    activeFrame = 0;
    purgeTime = 30;
    _prepareBudget = 0;
    _prepareQueue = [];
    _purgeTime = 0;
    _purgeFrame = 0;
    _purgeFrameLimit = 1000;
    _pendingLoads = 0;
    _noLoadFrames = 0;


    /**
     * Sets resource manager options
     * @param {*} [opt]
     */
    Set(opt)
    {
        if (!opt) return;
        assignIfExists(this, opt, ['systemMirror', 'maxPrepareTime', 'autoPurgeResources', 'purgeTime']);
    }
    

    /**
     * Fires on resource errors
     * - Used when a resource can only be identified by it's path
     * @param {string} path
     * @param {Error} err
     * @returns {Error} err
     */
    OnResError(path, err = new Tw2Error({path}))
    {
        path = Tw2ResMan.NormalizePath(path);
        const res = this.motherLode.Find(path);
        if (res)
        {
            res.OnError(err);
        }
        else
        {
            this.OnResEvent('error', path, {type: 'error', message: err.message, err});
        }
        return err;
    }

    /**
     * Fires on resource events
     * @param {string} eventName - The event's name
     * @param {string} path      - The resource's path
     * @param {*} [log={}]       - The event's log
     */
    OnResEvent(eventName, path, log = {})
    {
        const defaultLog = Tw2ResMan.DefaultLog[eventName.toUpperCase()];
        if (defaultLog)
        {
            log = Object.assign({}, defaultLog, log);
            const eventData = {res: this.motherLode.Find(path), path, log};

            const err = log.err;
            if (err)
            {
                this.motherLode.AddError(path, err);
                eventData.err = err;
                Object.assign(eventData, err.data);
            }

            log.message = log.message.includes(path) ? log.message : log.message += ` "${path}"`;
            this.emit(eventName.toLowerCase(), eventData);
        }
    }

    /**
     * IsLoading
     * @returns {Boolean}
     *
     */
    IsLoading()
    {
        return this._noLoadFrames < 2;
    }

    /**
     * Clears the motherLode {@link Tw2MotherLode}
     */
    Clear()
    {
        this.motherLode.Clear();
    }

    /**
     * Unloads and Clears the motherLode {@link Tw2MotherLode}
     */
    UnloadAndClear()
    {
        this.motherLode.UnloadAndClear();
    }

    /**
     * Internal update function. It is called every frame.
     * @param {Number} dt - deltaTime
     * @returns {Boolean}
     */
    PrepareLoop(dt)
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

        this._prepareBudget = this.maxPrepareTime;

        const startTime = Date.now();
        while (this._prepareQueue.length)
        {
            const
                res = this._prepareQueue[0][0],
                data = this._prepareQueue[0][1],
                xml = this._prepareQueue[0][2];

            this._prepareQueue.shift();

            try
            {
                res.Prepare(data, xml);
            }
            catch (err)
            {
                res.OnError(err);
            }

            this._prepareBudget -= (Date.now() - startTime) * 0.001;
            if (this._prepareBudget < 0) break;
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
    }

    /**
     * Gets a resource
     * @param {String} path
     * @returns {Tw2Resource} resource
     */
    GetResource(path)
    {
        let res;
        path = Tw2ResMan.NormalizePath(path);

        // Check if already loaded
        res = this.motherLode.Find(path);
        if (res)
        {
            if (res.IsPurged()) res.Reload();
            return res;
        }

        if (path.indexOf('dynamic:/') === 0)
        {
            this.OnResError(path, new ErrFeatureNotImplemented({feature: 'Dynamic resources'}));
            return null;
        }

        const extension = Tw2ResMan.GetPathExt(path);
        if (extension === null)
        {
            this.OnResError(path, new ErrResourceExtensionUndefined({path}));
            return null;
        }

        const Constructor = store.GetExtension(extension);
        if (!Constructor)
        {
            this.OnResError(path, new ErrResourceExtensionUnregistered({path, extension}));
            return null;
        }

        try
        {
            res = new Constructor();
            res.path = path;
            return Tw2ResMan.LoadResource(this, res);
        }
        catch (err)
        {
            this.OnResError(path, err);
            return null;
        }
    }

    /**
     * Gets a resource object
     * @param {string} path
     * @param {Function} onResolved - Callback fired when the object has loaded
     * @param {Function} onRejected - Callback fired when the object fails to load
     */
    GetObject(path, onResolved, onRejected)
    {
        path = Tw2ResMan.NormalizePath(path);

        // Check if already loaded
        let res = this.motherLode.Find(path);
        if (res)
        {
            res.AddObject(onResolved, onRejected);
            return;
        }

        try
        {
            res = new Tw2LoadingObject();
            res.path = path;
            res.AddObject(onResolved, onRejected);
            Tw2ResMan.LoadResource(this, res);
        }
        catch (err)
        {
            this.OnResError(path, err);
        }
    }

    /**
     * Reloads a resource
     * @param {Tw2Resource} resource
     * @returns {Tw2Resource} resource
     */
    ReloadResource(resource)
    {
        const path = resource.path;

        // Check if already loaded and good
        const res = this.motherLode.Find(path);
        if (res && !res.IsPurged())
        {
            return res;
        }

        try
        {
            return Tw2ResMan.LoadResource(this, resource);
        }
        catch (err)
        {
            this.OnResError(path, err);
            return resource;
        }
    }

    /**
     * Builds a url from a resource path
     * @param {string} path
     * @returns {string}
     */
    BuildUrl(path)
    {
        const prefixIndex = path.indexOf(':/');
        if (prefixIndex === -1)
        {
            throw new ErrResourcePrefixUndefined({path});
        }

        const prefix = path.substr(0, prefixIndex);
        if (prefix === 'http' || prefix === 'https')
        {
            return path;
        }

        const fullPrefix = store.GetPath(prefix);
        if (!fullPrefix)
        {
            throw new ErrResourcePrefixUnregistered({path, prefix});
        }

        return fullPrefix + path.substr(prefixIndex + 2);
    }

    /**
     * Normalizes a file path by making it lower case and replaces all '\\' with '/'
     * @param {string} path
     * @returns {string}
     */
    static NormalizePath(path)
    {
        if (path.substr(0, 5) === 'str:/') return path;
        path = path.toLowerCase();
        path.replace('\\', '/');
        return path;
    }

    /**
     * Gets a path's extension
     * @param {string} path
     * @returns {?string}
     */
    static GetPathExt(path)
    {
        if (path.substr(0, 5) === 'str:/')
        {
            const slash = path.indexOf('/', 5);
            if (slash === -1) return null;
            return path.substr(5, slash - 5);
        }
        else
        {
            const dot = path.lastIndexOf('.');
            if (dot === -1) return null;
            return path.substr(dot + 1);
        }
    }

    /**
     * Loads a resource
     * @param {Tw2ResMan} resMan
     * @param {Tw2Resource|Tw2LoadingObject} res
     * @returns {Tw2Resource|Tw2LoadingObject} res
     */
    static LoadResource(resMan, res)
    {
        const
            path = res.path,
            url = resMan.BuildUrl(path);

        resMan.motherLode.Add(path, res);

        if (res.DoCustomLoad && res.DoCustomLoad(url, Tw2ResMan.GetPathExt(url)))
        {
            return res;
        }

        const httpRequest = Tw2ResMan.CreateHttpRequest(res);
        httpRequest.onreadystatechange = Tw2ResMan.DoLoadResource(resMan, res);
        httpRequest.open('GET', url);

        try
        {
            httpRequest.send();
            resMan._pendingLoads++;
            res.OnRequested();
        }
        catch (err)
        {
            throw new ErrHTTPRequestSend({path});
        }

        return res;
    }

    /**
     * Creates an onreadystatechange callback
     * @param {Tw2ResMan} resMan
     * @param {Tw2Resource} res
     */
    static DoLoadResource(resMan, res)
    {
        const path = res.path;

        return function ()
        {
            let readyState = 0;

            try
            {
                readyState = this.readyState;
            }
            catch (err)
            {
                resMan._pendingLoads--;
                res.OnError(new ErrHTTPReadyState({path}));
                return;
            }

            if (readyState === 4)
            {
                const status = this.status;
                if (status === 200)
                {
                    let data = null,
                        xml = null;

                    try
                    {
                        data = this.responseText;
                        xml = this.responseXML;
                    }
                    catch (e)
                    {
                        data = this.response;
                    }

                    resMan._prepareQueue.push([res, data, xml]);
                    res.OnLoaded();
                }
                else
                {
                    res.OnError(new ErrHTTPStatus({path, status}));
                }
                resMan._pendingLoads--;
            }
        };
    }

    /**
     * Creates an HTTP request
     * @param {Tw2Resource} res
     * @returns {XMLHttpRequest|ActiveXObject}
     */
    static CreateHttpRequest(res)
    {
        let httpRequest = null;

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
                {
                    /*eslint-disable-line-no-empty*/
                }
            }
        }

        if (!httpRequest)
        {
            throw new ErrHTTPInstance({path: res.path});
        }
        else if (res.requestResponseType)
        {
            httpRequest.responseType = res.requestResponseType;
        }

        return httpRequest;
    }

    // Default log outputs for resource events
    static DefaultLog = {
        ERROR: {type: 'error', message: 'Uncaught error'},
        WARNING: {type: 'warn', message: 'Undefined warning'},
        REQUESTED: {type: 'info', message: 'Requested'},
        RELOADING: {type: 'info', message: 'Reloading'},
        LOADED: {type: 'info', message: 'Loaded'},
        PREPARED: {type: 'log', message: 'Prepared'},
        PURGED: {type: 'debug', message: 'Purged'},
        UNLOADED: {type: 'debug', message: 'Unloaded'}
    };

    /**
     * Class category
     * @type {string}
     */
    static category = 'resource_manager';

}


// Global instance of Tw2ResMan
export const resMan = new Tw2ResMan();
