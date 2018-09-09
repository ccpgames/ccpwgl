import {resMan} from '../../global';

/**
 * Tw2Resource base class
 *
 * @param {string} [path='']
 * @property {string} path
 * @property {boolean} _isLoading
 * @property {boolean} _isGood
 * @property {boolean} _isPurged
 * @property {Array} _notifications
 * @property {number} activeFrame
 * @property {number} doNotPurge
 * @class
 */
export class Tw2Resource
{
    constructor()
    {
        this.path = '';
        this._isLoading = false;
        this._isGood = false;
        this._isPurged = false;
        this._notifications = [];
        this.activeFrame = 0;
        this.doNotPurge = 0;
    }

    /**
     * Checks to see if the resource is loading
     * @returns {boolean}
     */
    IsLoading()
    {
        this.KeepAlive();
        return this._isLoading;
    }

    /**
     * Checks to see if the resource is good
     * @returns {boolean}
     */
    IsGood()
    {
        this.KeepAlive();
        return this._isGood;
    }

    /**
     * Checks to see if the resource has been purged
     * @returns {boolean}
     */
    IsPurged()
    {
        return this._isPurged;
    }

    /**
     * Unloads the resource
     */
    Unload()
    {

    }

    /**
     * Reloads the resource
     */
    Reload()
    {
        this.Unload();
        resMan.ReloadResource(this);
    }

    /**
     * Keeps the resource from being purged
     */
    KeepAlive()
    {
        this.activeFrame = resMan.activeFrame;
        if (this.IsPurged())
        {
            this.Reload();
        }
    }

    /**
     * Gets an array of resource errors, or an empty array if there are none
     * @returns {Array.<Tw2Error|Error>}
     */
    GetErrors()
    {
        return resMan.motherLode.GetErrors(this.path);
    }

    /**
     * Checks if the resource has errors
     * @returns {boolean}
     */
    HasErrors()
    {
        return resMan.motherLode.HasErrors(this.path);
    }

    /**
     * Fires on errors
     * @param {Error} err
     * @returns {Error}
     */
    OnError(err)
    {
        this._isGood = false;
        resMan.OnResEvent('error', this.path, err);
        this.UpdateNotifications('OnResError');
        return err;
    }

    /**
     * Fires on warnings
     * @param {*} [eventLog]
     */
    OnWarning(eventLog)
    {
        resMan.OnResEvent('warning', this.path, eventLog);
    }

    /**
     * LoadStarted
     * @param {*} [eventLog]
     */
    OnRequested(eventLog)
    {
        this._isLoading = true;
        this._isPurged = false;
        resMan.OnResEvent(this.IsPurged() ? 'reloading' : 'requested', this.path, eventLog);
        this.UpdateNotifications('ReleaseCachedData');
    }

    /**
     * LoadFinished
     * @param {*} [eventLog]
     */
    OnLoaded(eventLog)
    {
        this._isLoading = false;
        if (!this.HasErrors())
        {
            resMan.OnResEvent('loaded', this.path, eventLog);
        }
    }

    /**
     * PrepareFinished
     * @param {*} [eventLog]
     */
    OnPrepared(eventLog)
    {
        this._isLoading = false;
        if (!this.HasErrors())
        {
            this._isGood = true;
            resMan.OnResEvent('prepared', this.path, eventLog);
            this.UpdateNotifications('RebuildCachedData');
        }
    }

    /**
     * Fires when the resource has been unloads
     * @param {*} [eventLog]
     */
    OnUnloaded(eventLog)
    {
        resMan.OnResEvent(this.IsPurged() ? 'purged' : 'unloaded', this.path, eventLog);
    }

    /**
     * Registers a notification
     * @param {*} notification
     */
    RegisterNotification(notification)
    {
        if (!this._notifications.includes(notification))
        {
            this._notifications.push(notification);
            if (this.HasErrors())
            {
                if ('OnResError' in notification)
                {
                    notification['OnResError'](this);
                }
            }
            else if (this.IsGood() && 'RebuildCachedData' in notification)
            {
                notification.RebuildCachedData(this);
            }
        }
    }

    /**
     * Deregisters a notification
     * @param {*} notification
     */
    UnregisterNotification(notification)
    {
        this._notifications.splice(this._notifications.indexOf(notification), 1);
    }

    /**
     * Updates a notification
     * @param {string} funcName - The function name to call
     */
    UpdateNotifications(funcName)
    {
        for (let i = 0; i < this._notifications.length; i++)
        {
            if (funcName in this._notifications[i])
            {
                this._notifications[i][funcName](this);
            }
        }
    }
}

/**
 * An optional function for when the resource handles it's own loading
 * -  If the method returns false then the resource manager will handle the http request
 * @type {?Function}
 * @returns {boolean}
 */
Tw2Resource.prototype.DoCustomLoad = null;

/**
 * HTTP request response type
 * @type {null}
 */
Tw2Resource.prototype.requestResponseType = null;