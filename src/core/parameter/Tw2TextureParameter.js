import {resMan, device, util} from '../../global';
import {Tw2SamplerState} from '../sampler';
import {Tw2Parameter} from './Tw2Parameter';
import {Tw2TextureRes} from '../resource/Tw2TextureRes';

/**
 * Tw2TextureParameter
 *
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
 * @class
 */
export class Tw2TextureParameter extends Tw2Parameter
{
    constructor(name = '', texturePath = '')
    {
        super(name);
        this.resourcePath = texturePath;
        this.useAllOverrides = false;
        this.addressUMode = 1;
        this.addressVMode = 1;
        this.addressWMode = 1;
        this.filterMode = 2;
        this.mipFilterMode = 2;
        this.maxAnisotropy = 4;
        this.textureRes = null;
        this._sampler = null;

        if (texturePath) this.Initialize();
    }

    /**
     * Checks if the parameter has a texture that was attached
     * @returns {boolean}
     */
    get isTextureAttached()
    {
        return (this.textureRes && this.textureRes._isAttached);
    }

    /**
     * Initializes the texture
     */
    Initialize()
    {
        this.OnValueChanged();
    }

    /**
     * Sets the texture path
     * @param {string} value
     * @returns {boolean} true if changed
     */
    SetTexturePath(value)
    {
        this.resourcePath = value;
        this.OnValueChanged();
    }

    /**
     * Returns the texture's resource path
     * @returns {?string}
     */
    GetValue()
    {
        return this.isTextureAttached ? null : this.resourcePath;
    }

    /**
     * Sets the texture's resource manually
     * @param {Tw2TextureRes} res
     * @returns {boolean}
     */
    SetTextureRes(res)
    {
        if (this.textureRes !== res)
        {
            this.resourcePath = '';
            this.textureRes = res;
        }
        this.textureRes._isAttached = true;
    }

    /**
     * Fire on value changes
     * @param {*} [controller]        - An optional parameter for tracking the object that called this function
     * @param {string[]} [properties] - An optional array for tracking the properties that were modified
     */
    OnValueChanged(controller, properties)
    {
        if (this.resourcePath !== '')
        {
            if (this.resourcePath.indexOf('rgba:/') === 0)
            {
                if (!this.textureRes || this.textureRes.path !== this.resourcePath)
                {
                    const
                        color = this.resourcePath.replace('rgba:/', '').split(','),
                        texture = device.CreateSolidTexture([
                            parseFloat(color[0]),
                            parseFloat(color[1]),
                            parseFloat(color[2]),
                            color[3] !== undefined ? parseFloat(color[3]) : 255
                        ]);

                    this.textureRes = new Tw2TextureRes();
                    this.textureRes.path = this.resourcePath;
                    this.textureRes.Attach(texture);
                }
            }
            else
            {
                this.resourcePath = this.resourcePath.toLowerCase();
                this.textureRes = this.resourcePath !== '' ? resMan.GetResource(this.resourcePath) : null;
            }
        }

        this.UpdateOverrides();
        super.OnValueChanged(controller, properties);
    }

    /**
     * Apply
     * @param {number} stage
     * @param {Tw2SamplerState} sampler
     * @param {number} slices
     */
    Apply(stage, sampler, slices)
    {
        if (this.textureRes)
        {
            if (this.useAllOverrides && this._sampler)
            {
                this._sampler.samplerType = sampler.samplerType;
                this._sampler.isVolume = sampler.isVolume;
                this._sampler.registerIndex = sampler.registerIndex;
                sampler = this._sampler;
            }
            device.gl.activeTexture(device.gl.TEXTURE0 + stage);
            this.textureRes.Bind(sampler, slices);
        }
    }

    /**
     * Sets the textures overrides
     * @param {{}} [opt={}] - An object containing the override options to set
     */
    SetOverrides(opt = {})
    {
        util.assignIfExists(this, opt, Tw2TextureParameter.overrideProperties);
        this.OnValueChanged();
    }

    /**
     * Gets the texture's overrides
     * @returns {{}}
     */
    GetOverrides(out = {})
    {
        util.assignIfExists(out, this, Tw2TextureParameter.overrideProperties);
        return out;
    }

    /**
     * Updates the parameter's overrides
     */
    UpdateOverrides()
    {
        if (this.useAllOverrides)
        {
            this._sampler = this._sampler || new Tw2SamplerState();

            const
                {wrapModes, gl} = device,
                sampler = this._sampler;

            if (this.filterMode === 1)
            {
                switch (this.mipFilterMode)
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
                sampler.magFilter = gl.NEAREST;
            }
            else
            {
                switch (this.mipFilterMode)
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
                sampler.magFilter = gl.LINEAR;
            }

            sampler.addressU = wrapModes[this.addressUMode];
            sampler.addressV = wrapModes[this.addressVMode];
            sampler.addressW = wrapModes[this.addressWMode];
            sampler.anisotropy = this.maxAnisotropy;
            sampler.ComputeHash();
        }
        else if (this._sampler)
        {
            this._sampler = null;
        }
    }

    /**
     * Checks if a value is equal to the parameter's resource path
     * @param {*} value
     * @returns {boolean}
     */
    EqualsValue(value)
    {
        return value.toLowerCase() === this.GetValue();
    }

    /**
     * Copies another texture parameter's values
     * @param {Tw2TextureParameter} parameter
     * @param {boolean} [includeName]
     */
    Copy(parameter, includeName)
    {
        if (includeName) this.name = parameter.name;
        this.resourcePath = parameter.resourcePath;
        this.SetOverrides(parameter.GetOverrides);
    }

    /**
     * Clones the texture parameter
     * @returns {Tw2TextureParameter}
     */
    Clone()
    {
        const parameter = new Tw2TextureParameter();
        parameter.Copy(this, true);
        return parameter;
    }

    /**
     * Gets the texture's resources
     * @param {Array} [out=[]]
     * @returns {Array.<Tw2Resource>}
     */
    GetResources(out = [])
    {
        if (this.textureRes && !out.includes(this.textureRes))
        {
            out.push(this.textureRes);
        }
        return out;
    }

    /**
     * Checks if a value is a valid parameter value
     * @param {*} a
     * @returns {boolean}
     */
    static isValue(a)
    {
        return util.isString(a);
    }
}

/**
 * Alias for {@link Tw2TextureParameter.SetTexturePath}
 * @type {Tw2TextureParameter.SetTexturePath}
 */
Tw2TextureParameter.prototype.SetValue = Tw2TextureParameter.prototype.SetTexturePath;

/**
 * The texture parameter's override properties
 * @type {string[]}
 */
Tw2TextureParameter.overrideProperties = [
    'useAllOverrides',
    'addressUMode',
    'addressVMode',
    'addressWMode',
    'filterMode',
    'mipFilterMode',
    'maxAnisotropy'
];