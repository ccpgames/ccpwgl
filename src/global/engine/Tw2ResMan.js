import {logger} from './Tw2Logger';
import {store} from './Tw2Store';
import {Tw2MotherLode} from './Tw2MotherLode';
import {Tw2LoadingObject} from '../../core/resource/Tw2LoadingObject';

/**
 * Resource Manager
 *
 * @property {Boolean} systemMirror - Toggles whether {@link Tw2GeometryRes} Index and Buffer data arrays are visible
 * @property {Tw2MotherLode} motherLode
 * @property {Number} maxPrepareTime
 * @property {Number} prepareBudget
 * @property {Boolean} autoPurgeResources=true - Sets whether resources should be purged automatically
 * @property {Number} purgeTime=30 = Sets how long resources can remain inactive before they are purged
 * @property {Number} activeFrame
 * @property {Array} _prepareQueue
 * @property {Number} _purgeTime
 * @property {Number} _purgeFrame
 * @property {Number} _purgeFrameLimit
 * @property {Number} _pendingLoads - a count of how many things are pending load
 * @property {Number} _noLoadFrames
 * @class
 */
export class Tw2ResMan
{
    constructor()
    {
        this.motherLode = new Tw2MotherLode();
        this.systemMirror = false;
        this.maxPrepareTime = 0.05;
        this.prepareBudget = 0;
        this.autoPurgeResources = true;
        this.activeFrame = 0;
        this.purgeTime = 30;
        this._prepareQueue = [];
        this._purgeTime = 0;
        this._purgeFrame = 0;
        this._purgeFrameLimit = 1000;
        this._pendingLoads = 0;
        this._noLoadFrames = 0;
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

        this.prepareBudget = this.maxPrepareTime;

        const startTime = Date.now();
        while (this._prepareQueue.length)
        {
            const
                res = this._prepareQueue[0][0],
                data = this._prepareQueue[0][1],
                xml = this._prepareQueue[0][2];

            let handlesPrepareQueue;

            try
            {
                handlesPrepareQueue = res.Prepare(data, xml);
            }
            catch (e)
            {
                this._prepareQueue.shift();
                throw e;
            }

            if (!handlesPrepareQueue)
            {
                logger.log('res.event', {
                    msg: 'Prepared  ',
                    path: res.path,
                    time: (Date.now() - startTime) * 0.001,
                    type: 'prepared'
                });

                this._prepareQueue.shift();
            }

            this.prepareBudget -= (Date.now() - startTime) * 0.001;
            if (this.prepareBudget < 0) break;
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
                    this.motherLode.PurgeInactive(this._purgeFrame, this._purgeFrameLimit, this.purgeTime, logger);
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

        const ext = Tw2ResMan.GetPathExt(path);
        if (ext === null)
        {
            logger.log('res.error', {
                log: 'error',
                src: ['Tw2ResMan', 'ReloadResource'],
                msg: 'Undefined extension',
                type: 'extension.undefined',
                path: path
            });
            return null;
        }

        const Extension = store.GetExtension(ext);
        if (!Extension)
        {
            logger.log('res.error', {
                log: 'error',
                src: ['Tw2ResMan', 'ReloadResource'],
                msg: 'Unregistered extension',
                type: 'extension.unregistered',
                path: path,
                value: ext
            });
            return null;
        }

        res = new Extension();
        res.path = path;
        return Tw2ResMan.LoadResource(this, res);
    }

    /**
     * Gets a resource object
     * @param {string} path
     * @param {Function} callback
     */
    GetObject(path, callback)
    {
        const obj = {};
        path = Tw2ResMan.NormalizePath(path);

        // Check if already loaded
        let res = this.motherLode.Find(path);
        if (res)
        {
            res.AddObject(obj, callback);
            return;
        }

        res = new Tw2LoadingObject();
        res.path = path;
        res.AddObject(obj, callback);
        Tw2ResMan.LoadResource(this, res);
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
        if (res && !res.IsPurged()) return res;

        logger.log('res.event', {
            msg: 'Reloading ',
            path: path,
            type: 'reload'
        });

        return Tw2ResMan.LoadResource(this, resource);
    }

    /**
     * Builds a url from a resource path
     * @param {string} resPath
     * @returns {string}
     */
    static BuildUrl(resPath)
    {
        const prefixIndex = resPath.indexOf(':/');
        if (prefixIndex === -1)
        {
            logger.log('res.error', {
                log: 'warn',
                src: ['Tw2ResMan', 'BuildUrl'],
                msg: 'Invalid path',
                type: 'prefix.undefined',
                path: resPath
            });
            return resPath;
        }

        const
            prefix = resPath.substr(0, prefixIndex),
            path = store.GetPath(prefix);

        if (!path)
        {
            logger.log('res.error', {
                log: 'warn',
                src: ['Tw2ResMan', 'BuildUrl'],
                msg: 'Unregistered path',
                path: resPath,
                type: 'prefix.unregistered',
                value: prefix
            });
            return resPath;
        }

        return path + resPath.substr(prefixIndex + 2);
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
     * Returns a path suitable for logging by truncating really long file names
     * @param {string} path
     * @returns {string}
     */
    static LogPathString(path)
    {
        if (path.substr(0, 5) === 'str:/' && path.length > 64)
        {
            return path.substr(0, 64) + '...';
        }
        return path;
    }

    /**
     * Loads a resource
     * @param {Tw2ResMan} resMan
     * @param {Tw2Resource} res
     * @returns {Tw2Resource}
     */
    static LoadResource(resMan, res)
    {
        const
            path = res.path,
            url = Tw2ResMan.BuildUrl(path);

        res._isPurged = false;
        resMan.motherLode.Add(path, res);
        if (res.DoCustomLoad && res.DoCustomLoad(url)) return res;

        const httpRequest = Tw2ResMan.CreateHttpRequest(res.requestResponseType);
        if (httpRequest)
        {
            logger.log('res.event', {
                msg: 'Requesting',
                path: path,
                type: 'request'
            });

            httpRequest.onreadystatechange = Tw2ResMan.DoLoadResource(resMan, res);
            httpRequest.open('GET', url);
            res.LoadStarted();

            try
            {
                httpRequest.send();
                resMan._pendingLoads++;
            }
            catch (e)
            {
                logger.log('res.error', {
                    log: 'error',
                    src: ['Tw2ResMan', 'LoadResource'],
                    msg: 'Error sending object HTTP request',
                    path: path,
                    type: 'http.request',
                    err: e
                });
            }
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
        return function ()
        {
            let readyState = 0;

            try
            {
                readyState = this.readyState;
            }
            catch (e)
            {
                logger.log('res.error', {
                    log: 'error',
                    src: ['Tw2ResMan', '_DoLoadResource'],
                    msg: 'Communication error loading',
                    path: res.path,
                    type: 'http.readystate',
                    value: readyState
                });

                res.LoadFinished(false);
                resMan._pendingLoads--;
                return;
            }

            if (readyState === 4)
            {
                if (this.status === 200)
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

                    res.LoadFinished(true);
                    resMan._prepareQueue.push([res, data, xml]);
                }
                else
                {
                    logger.log('res.error', {
                        log: 'error',
                        src: ['Tw2ResMan', '_DoLoadResource'],
                        msg: 'Communication error loading',
                        path: res.path,
                        type: 'http.status',
                        value: this.status
                    });
                    res.LoadFinished(false);
                    res.PrepareFinished(false);
                }
                resMan._pendingLoads--;
            }
        };
    }

    /**
     * Creates an HTTP request
     * @param {?string} [responseType]
     * @returns {XMLHttpRequest|ActiveXObject}
     */
    static CreateHttpRequest(responseType)
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
            logger.log('res.error', {
                log: 'error',
                src: ['Tw2LoadingObject', 'Prepare'],
                msg: 'Could not create an XMLHTTP instance',
                type: 'http.instance'
            });
        }
        else if (responseType)
        {
            httpRequest.responseType = responseType;
        }

        return httpRequest;
    }
}

// Global instance of Tw2ResMan
export const resMan = new Tw2ResMan();
