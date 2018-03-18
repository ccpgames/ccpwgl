import {resMan} from '../global/Tw2ResMan';

/**
 * Tw2Resource base class
 *
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
     * Checks to see if the resource is purged
     * @returns {boolean}
     * @prototype
     */
    IsPurged()
    {
        return this._isPurged;
    }

    /**
     * LoadStarted
     */
    LoadStarted()
    {
        this._isLoading = true;
        this.UpdateNotifications('ReleaseCachedData');
    }

    /**
     * LoadFinished
     * @param {boolean} success
     */
    LoadFinished(success)
    {
        this._isLoading = false;
        if (!success) this._isGood = false;
    }

    /**
     * PrepareFinished
     * @param {boolean} success
     */
    PrepareFinished(success)
    {
        this._isLoading = false;
        this._isGood = success;
        this.UpdateNotifications('RebuildCachedData');
    }

    /**
     * Sets resource's isGood property
     * @param {boolean} success
     */
    SetIsGood(success)
    {
        this._isGood = success;
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
        if (this._isPurged) this.Reload();
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
            if (this._isGood && 'RebuildCachedData' in notification)
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