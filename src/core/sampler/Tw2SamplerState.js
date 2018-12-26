import {device, FilterMode, MipFilterMode, GL_LINEAR, GL_REPEAT, GL_TEXTURE_2D} from '../../global';

/**
 * Tw2SamplerState
 *
 * @property {string} name
 * @property {number} registerIndex
 * @property {number} minFilter
 * @property {number} maxFilter
 * @property {number} magFilter
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
    minFilter = GL_LINEAR;
    maxFilter = GL_LINEAR;
    magFilter = GL_LINEAR;
    minFilterNoMips = GL_LINEAR;
    addressU = GL_REPEAT;
    addressV = GL_REPEAT;
    addressW = GL_REPEAT;
    anisotropy = 1;
    samplerType = GL_TEXTURE_2D;
    isVolume = false;
    hash = 0;


    /**
     * Gets the current filter mode
     * @returns {number}
     */
    get filterMode()
    {
        return this.minFilterNoMips in FilterMode ? FilterMode[this.minFilterNoMips] : 2;
    }

    /**
     * Gets the current mip filter mode
     * @returns {number}
     */
    get mipFilterMode()
    {
        return this.minFilter in MipFilterMode ? MipFilterMode[this.minFilter] : 2;
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

}