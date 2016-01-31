/**
 * Tw2TextureParameter
 * @param {string} [name=''] - Name of the texture parameter
 * @param {string} [texturePath=''] - The texture's resource path
 * @property {string} name
 * @property {boolean} useAllOverrides
 * @property {number} addressUMode
 * @property {number} addressVMode
 * @property {number} addressWMode
 * @property {number} filterMode
 * @property {number} mapFilterMode
 * @property {number} maxAnisotropy
 * @property {Tw2TextureRes} textureRes
 * @property {Tw2SamplerState} _sampler
 * @constructor
 */
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

    this.useAllOverrides = false;
    this.addressUMode = 1;
    this.addressVMode = 1;
    this.addressWMode = 1;
    this.filterMode = 2;
    this.mipFilterMode = 2;
    this.maxAnisotropy = 4;
    this.textureRes = null;
    this._sampler = null;

    if (typeof(texturePath) != 'undefined')
    {
        this.resourcePath = texturePath;
        this.Initialize();
    }
    else
    {
        this.resourcePath = '';
    }
}

/**
 * Sets the texture's resource path
 * @param {string} texturePath
 * @constructor
 */
Tw2TextureParameter.prototype.SetTexturePath = function(texturePath)
{
    this.resourcePath = texturePath;
    if (this.resourcePath != '')
    {
        this.textureRes = resMan.GetResource(this.resourcePath);
    }
};

/**
 * Initializes the texture parameter
 * @prototype
 */
Tw2TextureParameter.prototype.Initialize = function()
{
    if (this.resourcePath != '')
    {
        this.textureRes = resMan.GetResource(this.resourcePath);
    }
    
    if (this.useAllOverrides)
    {
        this._sampler = new Tw2SamplerState();
        if (this.filterMode == 1)
        {
            switch (this.mipFilterMode)
            {
                case 0:
                    this._sampler.minFilter = device.gl.NEAREST;
                    break;
                case 1:
                    this._sampler.minFilter = device.gl.NEAREST_MIPMAP_NEAREST;
                    break;
                default:
                    this._sampler.minFilter = device.gl.NEAREST_MIPMAP_LINEAR;
            }
            this._sampler.minFilterNoMips = device.gl.NEAREST;
            this._sampler.magFilter = device.gl.NEAREST;
        }
        else
        {
            switch (this.mipFilterMode)
            {
                case 0:
                    this._sampler.minFilter = device.gl.LINEAR;
                    break;
                case 1:
                    this._sampler.minFilter = device.gl.LINEAR_MIPMAP_NEAREST;
                    break;
                default:
                    this._sampler.minFilter = device.gl.LINEAR_MIPMAP_LINEAR;
            }
            this._sampler.minFilterNoMips = device.gl.LINEAR;
            this._sampler.magFilter = device.gl.LINEAR;
        }
        var wrapModes = [
            0,
            device.gl.REPEAT,
            device.gl.MIRRORED_REPEAT,
            device.gl.CLAMP_TO_EDGE,
            device.gl.CLAMP_TO_EDGE,
            device.gl.CLAMP_TO_EDGE
        ];
        this._sampler.addressU = wrapModes[this.addressUMode];
        this._sampler.addressV = wrapModes[this.addressVMode];
        this._sampler.addressW = wrapModes[this.addressWMode];
        this._sampler.anisotropy = this.maxAnisotropy;
        this._sampler.ComputeHash();
    }
};

/**
 * Apply
 * @param stage
 * @param sampler
 * @param slices
 * @prototype
 */
Tw2TextureParameter.prototype.Apply = function(stage, sampler, slices)
{
    if (this.textureRes)
    {
        if (this.useAllOverrides)
        {
            this._sampler.samplerType = sampler.samplerType;
            this._sampler.isVolume = sampler.isVolume;
            this._sampler.registerIndex = sampler.registerIndex;
            sampler = this._sampler;
        }
        device.gl.activeTexture(device.gl.TEXTURE0 + stage);
        this.textureRes.Bind(sampler, slices);
    }
};
