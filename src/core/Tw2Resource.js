/**
 * Tw2Res - A Tw2Resource
 * @typedef {(Tw2Resource|Tw2EffectRes|Tw2GeometryRes|Tw2TextureRes)} Tw2Res
 */

/**
 * Tw2Resource
 * @property {string} path
 * @property {boolean} _isLoading
 * @property {boolean} _isGood
 * @property {boolean} _isPurged
 * @property {Array} _notifications
 * @property {number} activeFrame
 * @property {number} doNotPurge
 * @property {null|Function} _onLoadStarted - optional callback fired on res loading: callback(this)
 * @property {null|Function} _onLoadFinished - optional callback fired on res loaded: callback(this, success)
 * @property {null|Function} _onLoadPrepareFinished - optional callback fired on res prepare finish: callback(this, success)
 * @constructor
 */
function Tw2Resource()
{
    this.path = '';
    this._isLoading = false;
    this._isGood = false;
    this._isPurged = false;
    this._notifications = [];
    this.activeFrame = 0;
    this.doNotPurge = 0;
    this._onLoadStarted = null;
    this._onLoadFinished = null;
    this._onPrepareFinished = null;
}

/**
 * Checks to see if the resource is loading
 * @returns {boolean}
 * @prototype
 */
Tw2Resource.prototype.IsLoading = function()
{
    this.KeepAlive();
    return this._isLoading;
};

/**
 * Checks to see if the resource is good
 * @returns {boolean}
 * @prototype
 */
Tw2Resource.prototype.IsGood = function()
{
    this.KeepAlive();
    return this._isGood;
};

/**
 * Checks to see if the resource is purged
 * @returns {boolean}
 * @prototype
 */
Tw2Resource.prototype.IsPurged = function()
{
    return this._isPurged;
};

/**
 * LoadStarted
 * @prototype
 */
Tw2Resource.prototype.LoadStarted = function()
{
    this._isLoading = true;

    for (var i = 0; i < this._notifications.length; ++i)
    {
        this._notifications[i].ReleaseCachedData(this);
    }

    if (this._onLoadStarted)
    {
        this._onLoadStarted(this);
    }
};

/**
 * LoadFinished
 * @param {boolean} success
 * @prototype
 */
Tw2Resource.prototype.LoadFinished = function(success)
{
    this._isLoading = false;

    if (!success)
    {
        this._isGood = false;
    }

    if (this._onLoadFinished)
    {
        this._onLoadFinished(this, success);
    }
};

/**
 * PrepareFinished
 * @param {boolean} success
 * @prototype
 */
Tw2Resource.prototype.PrepareFinished = function(success)
{
    this._isLoading = false;
    this._isGood = success;

    for (var i = 0; i < this._notifications.length; ++i)
    {
        this._notifications[i].RebuildCachedData(this);
    }

    if (this._onPrepareFinished)
    {
        this._onPrepareFinished(this, success);
    }
};

/**
 * Sets resource's isGood property
 * @param {boolean} success
 * @prototype
 */
Tw2Resource.prototype.SetIsGood = function(success)
{
    this._isGood = success;
};

/**
 * Unload
 * @prototype
 */
Tw2Resource.prototype.Unload = function() {};

/**
 * Reloads the resource
 * @prototype
 */
Tw2Resource.prototype.Reload = function()
{
    this.Unload();
    resMan.ReloadResource(this);
};

/**
 * Keeps the resource from being purged
 * @prototype
 */
Tw2Resource.prototype.KeepAlive = function()
{
    this.activeFrame = resMan.activeFrame;
    if (this._isPurged)
    {
        this.Reload();
    }
};

/**
 * Registers a notification
 * @param notification
 * @prototype
 */
Tw2Resource.prototype.RegisterNotification = function(notification)
{
    for (var i = 0; i < this._notifications.length; ++i)
    {
        if (this._notifications[i] == notification)
        {
            return;
        }
    }

    this._notifications[this._notifications.length] = notification;

    if (this._isGood)
    {
        notification.RebuildCachedData(this);
    }
};

/**
 * Deregisters a notification
 * @param notification
 * @prototype
 */
Tw2Resource.prototype.UnregisterNotification = function(notification)
{
    for (var i = 0; i < this._notifications.length; ++i)
    {
        if (this._notifications[i] == notification)
        {
            this._notifications.splice(i, 1);
            return;
        }
    }
};



/**
 * Inherit
 * @param derived
 * @param base
 * @constructor
 */
function Inherit(derived, base)
{
    for (var i in base.prototype)
    {
        if (base.prototype.hasOwnProperty(i))
        {
            if (!(i in derived.prototype))
            {
                derived.prototype[i] = base.prototype[i];
            }
        }
    }

    derived.prototype._super = base.prototype;
}
