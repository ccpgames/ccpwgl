function Tw2TextureParameter(name, texturePath)
{
	if (typeof(name) != 'undefined')
	{
		this.name = name;
	}
	else
	{
		this.name = '';
	}
    this.textureRes = null;
    if (typeof (texturePath) != 'undefined')
	{
		this.resourcePath = texturePath;
		this.Initialize();
	}
	else
	{
		this.resourcePath = '';
	}
}

Tw2TextureParameter.prototype.SetTexturePath = function (texturePath)
{
	this.resourcePath = texturePath;
	if (this.resourcePath != '')
	{
		this.textureRes = resMan.GetResource(this.resourcePath);
	}
};

Tw2TextureParameter.prototype.Initialize = function ()
{
	if (this.resourcePath != '')
	{
		this.textureRes = resMan.GetResource(this.resourcePath);
	}
};

Tw2TextureParameter.prototype.Apply = function (stage, sampler, slices)
{
    if (this.textureRes)
    {
        device.gl.activeTexture(device.gl.TEXTURE0 + stage);
        this.textureRes.Bind(sampler, slices);
    }
};