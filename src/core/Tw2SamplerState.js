/**
 * Tw2SamplerState
 * @property {number} registerIndex
 * @property {string} name
 * @property {number} minFilter
 * @property {number} maxFilter
 * @property {number} minFilterNoMips
 * @property {number} addressU
 * @property {number} addressV
 * @property {number} addressW
 * @property {number} anisotropy
 * @property samplerType
 * @property {boolean} isVolume
 * @property {number} hash
 * @constructor
 */
function Tw2SamplerState()
{
    this.registerIndex = 0;
    this.name = '';
    this.minFilter = device.gl.LINEAR;
    this.maxFilter = device.gl.LINEAR;
    this.minFilterNoMips = device.gl.LINEAR;
    this.addressU = device.gl.REPEAT;
    this.addressV = device.gl.REPEAT;
    this.addressW = device.gl.REPEAT;
    this.anisotropy = 1;
    this.samplerType = device.gl.TEXTURE_2D;
    this.isVolume = false;
    this.hash = 0;
}

/**
 * Computes the sampler hash
 * @prototype
 */
Tw2SamplerState.prototype.ComputeHash = function()
{
    this.hash = 2166136261;
    this.hash *= 16777619;
    this.hash ^= this.minFilter;
    this.hash *= 16777619;
    this.hash ^= this.maxFilter;
    this.hash *= 16777619;
    this.hash ^= this.addressU;
    this.hash *= 16777619;
    this.hash ^= this.addressV;
    this.hash *= 16777619;
    this.hash ^= this.anisotropy;
};

/**
 * Apply
 * @param {boolean} hasMipMaps
 * @prototype
 */
Tw2SamplerState.prototype.Apply = function(hasMipMaps)
{
    var targetType = this.samplerType;
    var d = device;
    var gl = d.gl;
    gl.texParameteri(targetType, gl.TEXTURE_WRAP_S, hasMipMaps ? this.addressU : gl.CLAMP_TO_EDGE);
    gl.texParameteri(targetType, gl.TEXTURE_WRAP_T, hasMipMaps ? this.addressV : gl.CLAMP_TO_EDGE);
    gl.texParameteri(targetType, gl.TEXTURE_MIN_FILTER, hasMipMaps ? this.minFilter : this.minFilterNoMips);
    gl.texParameteri(targetType, gl.TEXTURE_MAG_FILTER, this.magFilter);
    if (d.anisotropicFilter && d.enableAnisotropicFiltering)
    {
        gl.texParameterf(targetType,
            d.anisotropicFilter.TEXTURE_MAX_ANISOTROPY_EXT,
            Math.min(this.anisotropy, d.anisotropicFilter.maxAnisotropy));
    }
};
