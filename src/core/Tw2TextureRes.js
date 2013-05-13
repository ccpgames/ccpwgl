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
        for (var j = 0; j < 6; ++j)
        {
            device.gl.texImage2D(device.gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, 0, format, format, device.gl.UNSIGNED_BYTE, this.images[j]);
        }
        device.gl.generateMipmap(device.gl.TEXTURE_CUBE_MAP);
        device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, null);
        this.width = this.images[0].width;
        this.height = this.images[0].height;
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
        this.isCube = true;
        this._facesLoaded = 0;
        var base = path.substr(0, path.length - 5);
        var extensions = ['.px', '.nx', '.py', '.ny', '.pz', '.nz'];
        var onCubeFaceImageLoaded = function (img)
        {
            resMan._pendingLoads--;
            self._facesLoaded++;
            if (self._facesLoaded >= 6)
            {
                self.LoadFinished(true);
                resMan._prepareQueue.push([self, 'cube', null]);
            }
        };
        for (var i = 0; i < 6; ++i)
        {
            resMan._pendingLoads++;
            this.images[i] = new Image();
            this.images[i].crossOrigin = 'anonymous';
            this.images[i].onload = onCubeFaceImageLoaded;
            this.images[i].src = base + mipExt + extensions[i] + '.png';
        }
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
                path = path.substr(0, index) + mipExt + path.substr(index);
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
