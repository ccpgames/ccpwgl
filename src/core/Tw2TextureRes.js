/**
 * Tw2TextureRes
 * @property {WebglTexture} texture
 * @property {boolean} isCube
 * @property {Array} images
 * @property {number} width
 * @property {number} height
 * @property {number} _facesLoaded
 * @property {boolean} hasMipMaps
 * @property {number} _currentSampler
 * @inherit Tw2Resource
 * @constructor
 */
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

/**
 * Prepare
 * TODO: @param xml is redundant
 * @param {string} text - Used to identify the type of image, options are 'cube' or anything else
 * @param xml
 * @prototype
 */
Tw2TextureRes.prototype.Prepare = function(text, xml)
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

/**
 * Finds out if a number is to the power of 2
 * @param {number} x
 * @returns {boolean}
 * @prototype
 */
Tw2TextureRes.prototype.IsPowerOfTwo = function(x)
{
    return (x & (x - 1)) == 0;
};

/**
 * An optional method Tw2objects can have that allows them to take over the construction of it's components during resource loading
 * @param {string} path - texture resource path
 * @returns {boolean}
 * @prototype
 */
Tw2TextureRes.prototype.DoCustomLoad = function(path)
{
    var index;

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
        this.images[0].onload = function()
        {
            resMan._pendingLoads--;
            self.LoadFinished(true);
            resMan._prepareQueue.push([self, 'cube', null]);
        };
        path = path.substr(0, path.length - 5) + '.png';
        if (device.mipLevelSkipCount > 0)
        {
            index = path.lastIndexOf('.');
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
        this.images[0].onload = function()
        {
            resMan._pendingLoads--;
            self.LoadFinished(true);
            resMan._prepareQueue.push([self, '', null]);
        };
        if (device.mipLevelSkipCount > 0)
        {
            index = path.lastIndexOf('.');
            if (index >= 0)
            {
                path = path.substr(0, index - 2) + mipExt + path.substr(index);
            }
        }
        this.images[0].src = path;
    }
    return true;
};

/**
 * Unloads the texture from memory
 * @returns {boolean}
 * @constructor
 */
Tw2TextureRes.prototype.Unload = function()
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

/**
 * Attach
 * @param {WebglTexture} texture
 * @constructor
 */
Tw2TextureRes.prototype.Attach = function(texture)
{
    this.texture = texture;
    this.LoadFinished(true);
    this.PrepareFinished(true);
};

/**
 * Bind
 * @param sampler
 * @param slices
 * @constructor
 */
Tw2TextureRes.prototype.Bind = function(sampler, slices)
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


/**
 * Creates a png base 64 blob from the textureRes' WebGLTexture
 * @param {number} [width=this.width]   - Optional width override
 * @param {number} [height=this.height] - Optional height override
 * @returns {null|string}               - png base64 blob
 */
Tw2TextureRes.prototype.CreateBlobFromTexture  = function(width, height)
{
    if (!this.texture) return null;
    return Tw2TextureRes.CreateBlobFromTexture(this.texture, width != undefined ? width : this.width, height != undefined ? height : this.height);
};

/**
 * Creates an HTML Image element from the textureRes' WebGLTexture
 * @param {number} [width=this.width]   - Optional width override
 * @param {number} [height=this.height] - Optional height override
 * @returns {null|HTMLElement}          - an HTML IMG element
 */
Tw2TextureRes.prototype.CreateImageFromTexture = function(width, height)
{
    if (!this.texture) return null;
    return Tw2TextureRes.CreateImageFromTexture(this.texture, width != undefined ? width : this.width, height != undefined ? height : this.height);
};

/**
 * Creates a png base 64 blob from a WebGLTexture
 * @param {WebGLTexture} texture - The texture to convert
 * @param {number} [width]       - Optional image width, else uses textureRes width, or a default width
 * @param {number} [height]      - Optional image height, else uses textureRes height, or a default height
 * @returns {string}             - png base64 blob
 */
Tw2TextureRes.CreateBlobFromTexture  = function(texture, width, height)
{
    width = width || Tw2TextureRes.DEFAULT_IMAGE_WIDTH;
    height = height || Tw2TextureRes.DEFAULT_IMAGE_HEIGHT;
    var gl = device.gl;

    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    var data = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.deleteFramebuffer(fb);

    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');
    var imageData = context.createImageData(width, height);
    imageData.data.set(data);
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
};

/**
 * Creates an Html IMG element from a WebGLTexture
 * @param {WebGLTexture} texture - The texture to convert
 * @param {number} [width]       - Optional image width, else uses textureRes width, or a default width
 * @param {number} [height]      - Optional image height, else uses textureRes height, or a default height
 * @returns {HtmlElement}        - an HTML IMG element
 */
Tw2TextureRes.CreateImageFromTexture = function(texture, width, height)
{
    var img = new Image();
    img.src = Tw2TextureRes.CreateBlobFromTexture(texture, width, height);
    return img;
};

// Default image sizes to use when creating an HTML Image element from a textureRes that has no width or height
Tw2TextureRes.DEFAULT_IMAGE_WIDTH = 512;
Tw2TextureRes.DEFAULT_IMAGE_HEIGHT = 512;



Inherit(Tw2TextureRes, Tw2Resource);

// Register 'png' and 'cube' extensions with the resource manager
resMan.RegisterExtension('png', Tw2TextureRes);
resMan.RegisterExtension('cube', Tw2TextureRes);
