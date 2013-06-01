function Tw2Resource()
{
    this.path = '';
    this._isLoading = false;
    this._isGood = false;
    this._isPurged = false;
	this._notifications = [];
	this.activeFrame = 0;
	this.doNotPurge = 0;
}

Tw2Resource.prototype.IsLoading = function ()
{
    this.KeepAlive();
    return this._isLoading;
};

Tw2Resource.prototype.IsGood = function ()
{
    this.KeepAlive();
    return this._isGood;
};

Tw2Resource.prototype.IsPurged = function ()
{
    return this._isPurged;
};

Tw2Resource.prototype.LoadStarted = function ()
{
    this._isLoading = true;
	for (var i = 0; i < this._notifications.length; ++i)
	{
		this._notifications[i].ReleaseCachedData(this);
	}
};

Tw2Resource.prototype.LoadFinished = function (success)
{
    this._isLoading = false;
    if (!success)
    {
        this._isGood = false;
    }
};

Tw2Resource.prototype.PrepareFinished = function (success)
{
    this._isLoading = false;
    this._isGood = success;
	for (var i = 0; i < this._notifications.length; ++i)
	{
		this._notifications[i].RebuildCachedData(this);
	}
};

Tw2Resource.prototype.SetIsGood = function (success)
{
    this._isGood = success;
};

Tw2Resource.prototype.Unload = function ()
{
};

Tw2Resource.prototype.Reload = function ()
{
    this.Unload();
    resMan.ReloadResource(this);
};

Tw2Resource.prototype.KeepAlive = function ()
{
    this.activeFrame = resMan.activeFrame;
    if (this._isPurged)
    {
        this.Reload();
    }
};

Tw2Resource.prototype.RegisterNotification = function (notification)
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

Tw2Resource.prototype.UnregisterNotification = function (notification)
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


function Inherit(derived, base)
{
    for (var i in base.prototype)
    {
        if (!(i in derived.prototype))
        {
            derived.prototype[i] = base.prototype[i];
        }
    }
	derived.prototype._super = base.prototype;
}