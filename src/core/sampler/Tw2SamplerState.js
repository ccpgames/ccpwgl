import {device} from '../../global';

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
        const gl = device.gl;
        this.name = '';
        this.registerIndex = 0;
        this.minFilter = gl.LINEAR;
        this.maxFilter = gl.LINEAR;
        this.minFilterNoMips = gl.LINEAR;
        this.addressU = gl.REPEAT;
        this.addressV = gl.REPEAT;
        this.addressW = gl.REPEAT;
        this.anisotropy = 1;
        this.samplerType = gl.TEXTURE_2D;
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
    Apply(hasMipMaps)
    {
        const
            targetType = this.samplerType,
            d = device,
            gl = d.gl;

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
