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

    name = '';
    registerIndex = 0;
    minFilter = device.gl.LINEAR;
    maxFilter = device.gl.LINEAR;
    minFilterNoMips = device.gl.LINEAR;
    addressU = device.gl.REPEAT;
    addressV = device.gl.REPEAT;
    addressW = device.gl.REPEAT;
    anisotropy = 1;
    samplerType = device.gl.TEXTURE_2D;
    isVolume = false;
    hash = 0;


    /**
     * Gets the current filter mode
     * @returns {number}
     */
    get filterMode()
    {
        return this.minFilterNoMips in Tw2SamplerState.FilterMode ? Tw2SamplerState.FilterMode[this.minFilterNoMips] : 2;
    }

    /**
     * Gets the current mip filter mode
     * @returns {number}
     */
    get mipFilterMode()
    {
        return this.minFilter in Tw2SamplerState.MipFilterMode ? Tw2SamplerState.MipFilterMode[this.minFilter] : 2;
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
     * Filter modes
     */
    static FilterMode = {
        9728: 1,
        9729: 2
    };

    /**
     * Mip filter modes
     */
    static MipFilterMode = {
        9728: 0,
        9729: 0,
        9984: 1,
        9985: 1,
        9986: 2,
        9987: 2
    };

}