function Tw2TextureRes()
{
	this._super.constructor.call(this);
    this.texture = null;
	this.isCube = false;
	this.images = [];
	this.width = 0;
	this.height = 0;
	this._facesLoaded = 0;
	this.hasMipMaps = false;
	this._currentSampler = 0;
}

Tw2TextureRes.prototype.Prepare = function (text, xml)
{
    var format = device.gl.RGBA;
    if (this.images[0].ccpGLFormat)
    {
        format = this.images[0].ccpGLFormat;
    }
    if (text == 'cube')
    {
        this.texture = device.gl.createTexture();
        device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, this.texture);

        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.images[0].height;
        var ctx = canvas.getContext('2d');
        for (var j = 0; j < 6; ++j)
        {
            ctx.drawImage(this.images[0], j * canvas.width, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
            device.gl.texImage2D(device.gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, 0, format, format, device.gl.UNSIGNED_BYTE, canvas);
        }
        device.gl.generateMipmap(device.gl.TEXTURE_CUBE_MAP);
        device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, null);
        this.width = canvas.width;
        this.height = canvas.height;
        this.hasMipMaps = true;
        this.PrepareFinished(true);
    }
    else
    {
        this.texture = device.gl.createTexture();
        device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture);
        device.gl.texImage2D(device.gl.TEXTURE_2D, 0, format, format, device.gl.UNSIGNED_BYTE, this.images[0]);
        this.hasMipMaps = this.IsPowerOfTwo(this.images[0].width) && this.IsPowerOfTwo(this.images[0].height);
        if (this.hasMipMaps)
        {
            device.gl.generateMipmap(device.gl.TEXTURE_2D);
        }
        device.gl.bindTexture(device.gl.TEXTURE_2D, null);
        this.width = this.images[0].width;
        this.height = this.images[0].height;
        this.PrepareFinished(true);
    }
    delete this.images;
};

Tw2TextureRes.prototype.IsPowerOfTwo = function (x)
{
    return (x & (x - 1)) == 0;
};

Tw2TextureRes.prototype.DoCustomLoad = function (path)
{
    this.LoadStarted();
    this.images = [];
    var self = this;

    path = resMan.BuildUrl(path);

    var mipExt = '';
    if (device.mipLevelSkipCount > 0)
    {
        mipExt = '.' + device.mipLevelSkipCount.toString();
    }

    if (path.substr(-5) == '.cube')
    {
        resMan._pendingLoads++;
        this.isCube = true;
        this.images[0] = new Image();
        this.images[0].crossOrigin = 'anonymous';
        this.images[0].onload = function ()
        {
            resMan._pendingLoads--;
            self.LoadFinished(true);
            resMan._prepareQueue.push([self, 'cube', null]);
        };
        path = path.substr(0, path.length-5) + '.png';
        if (device.mipLevelSkipCount > 0)
        {
            var index = path.lastIndexOf('.');
            if (index >= 0)
            {
                path = path.substr(0, index - 2) + mipExt + path.substr(index);
            }
        }
        this.images[0].src = path;
    }
    else
    {
        resMan._pendingLoads++;
        this.isCube = false;
        this.images[0] = new Image();
        this.images[0].crossOrigin = 'anonymous';
        this.images[0].onload = function ()
        {
            resMan._pendingLoads--;
            self.LoadFinished(true);
            resMan._prepareQueue.push([self, '', null]);
        };
        if (device.mipLevelSkipCount > 0)
        {
            var index = path.lastIndexOf('.');
            if (index >= 0)
            {
                path = path.substr(0, index - 2) + mipExt + path.substr(index);
            }
        }
        this.images[0].src = path;
    }
    return true;
};

Tw2TextureRes.prototype.Unload = function ()
{
    if (this.texture)
    {
        device.gl.deleteTexture(this.texture);
        this.texture = null;
        this.isPurged = true;
    }
    this._isPurged = true;
    this._isGood = false;
    return true;
};

Tw2TextureRes.prototype.Attach = function (texture)
{
    this.texture = texture;
    this.LoadFinished(true);
    this.PrepareFinished(true);
};

Tw2TextureRes.prototype.Bind = function (sampler, slices)
{
    this.KeepAlive();
    var targetType = sampler.samplerType;
    if (targetType != (this.isCube ? device.gl.TEXTURE_CUBE_MAP : device.gl.TEXTURE_2D))
    {
        return;
    }
    if (this.texture == null)
    {
        device.gl.bindTexture(
            targetType,
            targetType == device.gl.TEXTURE_2D ? device.GetFallbackTexture() : device.GetFallbackCubeMap());
        return;
    }
    if (sampler.isVolume)
    {
        device.gl.uniform1f(slices, this.height / this.width);
    }
    device.gl.bindTexture(targetType, this.texture);
    if (sampler.hash != this._currentSampler)
    {
        sampler.Apply(this.hasMipMaps);
        this._currentSampler = sampler.hash;
    }
};

Inherit(Tw2TextureRes, Tw2Resource);

resMan.RegisterExtension('png', Tw2TextureRes);
resMan.RegisterExtension('cube', Tw2TextureRes);
