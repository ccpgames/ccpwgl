import {device} from '../global/Tw2Device';
import {Tw2SamplerState} from './Tw2SamplerState';

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