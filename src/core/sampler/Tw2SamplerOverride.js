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
 * @class
 */
export class Tw2SamplerOverride
{
    constructor()
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

        let sampler = null;

        /**
         * Gets the sampler
         * @param originalSampler
         * @returns {Tw2SamplerState}
         */
        this.GetSampler = function(originalSampler)
        {
            if (!sampler)
            {
                sampler = new Tw2SamplerState();
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
            }

            return sampler;
        };
    }
}