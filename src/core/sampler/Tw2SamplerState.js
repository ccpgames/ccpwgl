import {device} from '../global/Tw2Device';

/**
 * Tw2SamplerState
 *
 * @property {string} name
 * @property {number} registerIndex
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
 * @class
 */
export class Tw2SamplerState
{
    constructor()
    {
        this.name = '';
        this.registerIndex = 0;
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
     */
    ComputeHash()
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
    }

    /**
     * Apply
     * @param {boolean} hasMipMaps
     */
    Apply (hasMipMaps)
    {
        const
            targetType = this.samplerType,
            d = device;

        d.gl.texParameteri(targetType, d.gl.TEXTURE_WRAP_S, hasMipMaps ? this.addressU : d.gl.CLAMP_TO_EDGE);
        d.gl.texParameteri(targetType, d.gl.TEXTURE_WRAP_T, hasMipMaps ? this.addressV : d.gl.CLAMP_TO_EDGE);
        d.gl.texParameteri(targetType, d.gl.TEXTURE_MIN_FILTER, hasMipMaps ? this.minFilter : this.minFilterNoMips);
        d.gl.texParameteri(targetType, d.gl.TEXTURE_MAG_FILTER, this.magFilter);
        if (d.ext.AnisotropicFilter && d.enableAnisotropicFiltering)
        {
            d.gl.texParameterf(targetType,
                d.ext.AnisotropicFilter.TEXTURE_MAX_ANISOTROPY_EXT,
                Math.min(this.anisotropy, d.ext.AnisotropicFilter.maxAnisotropy));
        }
    }

    /**
     * Gets the current filter mode
     * @returns {number}
     */
    GetFilterMode()
    {
        return this.minFilterNoMips in Tw2SamplerState.FilterMode ? Tw2SamplerState.FilterMode[this.minFilterNoMips] : 2;
    }

    /**
     * Gets the current mip filter mode
     * @returns {number}
     */
    GetMipFilterMode()
    {
        return this.minFilter in Tw2SamplerState.MipFilterMode ? Tw2SamplerState.MipFilterMode[this.minFilter] : 2;
    }
}

/**
 * Filter modes
 */
Tw2SamplerState.FilterMode = {
    9728: 1,
    9729: 2
};

/**
 * Mip filter modes
 */
Tw2SamplerState.MipFilterMode = {
    9728: 0,
    9729: 0,
    9984: 1,
    9985: 1,
    9986: 2,
    9987: 2
};
