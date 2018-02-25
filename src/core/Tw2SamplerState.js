import {device} from './Tw2Device';

/**
 * Tw2SamplerOverride
 * @property {number} addressU
 * @property {number} addressV
 * @property {number} addressW
 * @property {number} filter
 * @property {number} mipFilter
 * @property {number} lodBias
 * @property {number} maxMipLevel
 * @property {number} maxAnisotropy
 * @constructor
 */
export function Tw2SamplerOverride()
{
    this.name = '';

    this.addressU = 0;
    this.addressV = 0;
    this.addressW = 0;
    this.filter = 0;
    this.mipFilter = 0;
    this.lodBias = 0;
    this.maxMipLevel = 0;
    this.maxAnisotropy = 0;

    var sampler = null;

    /**
     * GetSampler
     * @param originalSampler
     * @returns {*}
     * @method
     */
    this.GetSampler = function(originalSampler)
    {
        if (!sampler)
        {
            sampler = new Tw2SamplerState();
            sampler.registerIndex = originalSampler.registerIndex;
            sampler.name = originalSampler.name;
            if (this.filter === 1)
            {
                switch (this.mipFilter)
                {
                    case 0:
                        sampler.minFilter = device.gl.NEAREST;
                        break;
                    case 1:
                        sampler.minFilter = device.gl.NEAREST_MIPMAP_NEAREST;
                        break;
                    default:
                        sampler.minFilter = device.gl.NEAREST_MIPMAP_LINEAR;
                }
                sampler.minFilterNoMips = device.gl.NEAREST;
            }
            else
            {
                switch (this.mipFilter)
                {
                    case 0:
                        sampler.minFilter = device.gl.LINEAR;
                        break;
                    case 1:
                        sampler.minFilter = device.gl.LINEAR_MIPMAP_NEAREST;
                        break;
                    default:
                        sampler.minFilter = device.gl.LINEAR_MIPMAP_LINEAR;
                }
                sampler.minFilterNoMips = device.gl.LINEAR;
            }
            if (this.filter === 1)
            {
                sampler.magFilter = device.gl.NEAREST;
            }
            else
            {
                sampler.magFilter = device.gl.LINEAR;
            }
            var wrapModes = [
                0,
                device.gl.REPEAT,
                device.gl.MIRRORED_REPEAT,
                device.gl.CLAMP_TO_EDGE,
                device.gl.CLAMP_TO_EDGE,
                device.gl.CLAMP_TO_EDGE
            ];
            sampler.addressU = wrapModes[this.addressU];
            sampler.addressV = wrapModes[this.addressV];
            sampler.addressW = wrapModes[this.addressW];
            if (this.filter === 3 || this.mipFilter === 3)
            {
                sampler.anisotropy = Math.max(this.maxAnisotropy, 1);
            }
            sampler.samplerType = originalSampler.samplerType;
            sampler.isVolume = originalSampler.isVolume;
            sampler.ComputeHash();
        }
        return sampler;
    };
}


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
export function Tw2SamplerState()
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
    if (d.ext.AnisotropicFilter && d.enableAnisotropicFiltering)
    {
        gl.texParameterf(targetType,
            d.ext.AnisotropicFilter.TEXTURE_MAX_ANISOTROPY_EXT,
            Math.min(this.anisotropy, d.ext.AnisotropicFilter.maxAnisotropy));
    }
};
