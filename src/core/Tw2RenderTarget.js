function Tw2RenderTarget()
{
    this.texture = null;
    this._frameBuffer = null;
    this.width = null;
    this.height = null;
    this.hasDepth = null;
}

Tw2RenderTarget.prototype.Destroy = function ()
{
    if (this.texture)
    {
        device.gl.deleteTexture(this.texture.texture);
        this.texture = null;
    }
    if (this._renderBuffer)
    {
        device.gl.deleteRenderbuffer(this._renderBuffer);
        this._renderBuffer = null;
    }
    if (this._frameBuffer)
    {
        device.gl.deleteFramebuffer(this._frameBuffer);
        this._frameBuffer = null;
    }
};

Tw2RenderTarget.prototype.Create = function (width, height, hasDepth)
{
    this.Destroy();
    this.texture = new Tw2TextureRes();
    this.texture.Attach(device.gl.createTexture());

    this._frameBuffer = device.gl.createFramebuffer();
    device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, this._frameBuffer);

    device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture.texture);
    device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, width, height, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, null);
    device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, device.gl.LINEAR);
    device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, device.gl.LINEAR);
    device.gl.bindTexture(device.gl.TEXTURE_2D, null);

    this._renderBuffer = null;
    if (hasDepth)
    {
        this._renderBuffer = device.gl.createRenderbuffer();
        device.gl.bindRenderbuffer(device.gl.RENDERBUFFER, this._renderBuffer);
        device.gl.renderbufferStorage(device.gl.RENDERBUFFER, device.gl.DEPTH_COMPONENT16, width, height);
    }

    device.gl.framebufferTexture2D(device.gl.FRAMEBUFFER, device.gl.COLOR_ATTACHMENT0, device.gl.TEXTURE_2D, this.texture.texture, 0);
    if (hasDepth)
    {
        device.gl.framebufferRenderbuffer(device.gl.FRAMEBUFFER, device.gl.DEPTH_ATTACHMENT, device.gl.RENDERBUFFER, this._renderBuffer);
    }
    device.gl.bindRenderbuffer(device.gl.RENDERBUFFER, null);
    device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, null);

    this.width = width;
    this.height = height;
    this.hasDepth = hasDepth;
};

Tw2RenderTarget.prototype.Set = function ()
{
    device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, this._frameBuffer);
    device.gl.viewport(0, 0, this.width, this.height);
};

Tw2RenderTarget.prototype.Unset = function ()
{
    device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, null);
    device.gl.viewport(0, 0, device.viewportWidth, device.viewportHeight);
};