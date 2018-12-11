import {device} from '../../global';
import {Tw2SamplerState} from './Tw2SamplerState';

/**
 * Tw2SamplerOverride
 *
 * @property {number} addressU
 * @property {number} addressV
 * @property {number} addressW
 * @property {number} filter
 * @property {number} mipFilter
 * @property {number} lodBias
 * @property {number} maxMipLevel
 * @property {number} maxAnisotropy
 * @property {Tw2SamplerState} _sampler
 * @class
 */
export class Tw2SamplerOverride
{

    name = '';
    addressU = 0;
    addressV = 0;
    addressW = 0;
    filter = 0;
    mipFilter = 0;
    lodBias = 0;
    maxMipLevel = 0;
    maxAnisotropy = 0;
    _sampler = null;


    /**
     * Gets the sampler
     * @param {Tw2SamplerState} originalSampler
     * @returns {Tw2SamplerState}
     */
    GetSampler(originalSampler)
    {
        if (this._sampler)
        {
            return this._sampler;
        }

        this._sampler = new Tw2SamplerState();
        const sampler = this._sampler;
        sampler.registerIndex = originalSampler.registerIndex;
        sampler.name = originalSampler.name;

        const {wrapModes, gl} = device;

        if (this.filter === 1)
        {
            switch (this.mipFilter)
            {
                case 0:
                    sampler.minFilter = gl.NEAREST;
                    break;

                case 1:
                    sampler.minFilter = gl.NEAREST_MIPMAP_NEAREST;
                    break;

                default:
                    sampler.minFilter = gl.NEAREST_MIPMAP_LINEAR;
            }

            sampler.minFilterNoMips = gl.NEAREST;
        }
        else
        {
            switch (this.mipFilter)
            {
                case 0:
                    sampler.minFilter = gl.LINEAR;
                    break;

                case 1:
                    sampler.minFilter = gl.LINEAR_MIPMAP_NEAREST;
                    break;

                default:
                    sampler.minFilter = gl.LINEAR_MIPMAP_LINEAR;
            }

            sampler.minFilterNoMips = gl.LINEAR;
        }

        if (this.filter === 3 || this.mipFilter === 3)
        {
            sampler.anisotropy = Math.max(this.maxAnisotropy, 1);
        }

        sampler.magFilter = this.filter === 1 ? gl.NEAREST : gl.LINEAR;
        sampler.addressU = wrapModes[this.addressU];
        sampler.addressV = wrapModes[this.addressV];
        sampler.addressW = wrapModes[this.addressW];
        sampler.samplerType = originalSampler.samplerType;
        sampler.isVolume = originalSampler.isVolume;
        sampler.ComputeHash();
        return sampler;
    }

}