import {util} from '../math';
import {resMan} from './Tw2ResMan';
import {device} from './Tw2Device';
import {store} from './Tw2VariableStore';
import {Tw2TextureParameter} from './Tw2TextureParameter';

/**
 * Tw2Effect
 *
 * @property {number|string} _id
 * @property {string} name
 * @property {string} effectFilePath
 * @property {Tw2EffectRes|null} effectRes
 * @property {Object.<string, Parameter>} parameters
 * @property {Array} passes
 * @property {Array} samplerOverrides
 * @property {boolean} autoParameter
 * @property {Function} _onModified
 * @class
 */
export class Tw2Effect
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.effectFilePath = '';
        this.effectRes = null;
        this.parameters = {};
        this.passes = [];
        this.samplerOverrides = [];
        this.autoParameter = false;
    }

    /**
     * Initializes the Tw2Effect
     */
    Initialize()
    {
        if (this.effectFilePath !== '')
        {
            this.effectFilePath = this.effectFilePath.toLowerCase();
            const path = Tw2Effect.ToEffectResPath(this.effectFilePath);
            this.effectRes = resMan.GetResource(path);
            this.effectRes.RegisterNotification(this);
        }
    }

    /**
     * Checks if the effect's effect resource is good
     * @returns {boolean}
     */
    IsGood()
    {
        return this.effectRes && this.effectRes.IsGood();
    }

    /**
     * Gets effect resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.effectRes && !out.includes(this.effectRes))
        {
            out.push(this.effectRes);
        }

        for (let param in this.parameters)
        {
            if (this.parameters.hasOwnProperty(param))
            {
                if ('GetResources' in this.parameters[param])
                {
                    this.parameters[param].GetResources(out);
                }
            }
        }

        return out;
    }

    /**
     * Gets the effect's resource
     * @returns {?Tw2EffectRes}
     */
    GetEffectRes()
    {
        return this.effectRes;
    }

    /**
     * Rebuilds Cached Data
     * @param resource
     */
    RebuildCachedData(resource)
    {
        if (resource.IsGood())
        {
            this.effectRes = resource;
            this.BindParameters();
        }
    }

    /**
     * Unbinds parameters
     * @returns {boolean}
     */
    UnbindParameters()
    {
        for (let i = 0; i < this.passes.length; ++i)
        {
            for (let j = 0; j < this.passes[i].stages.length; ++j)
            {
                for (let k = 0; k < this.passes[i].stages[j].reroutedParameters.length; ++k)
                {
                    const parameter = this.passes[i].stages[j].reroutedParameters[k];
                    if (parameter.Unbind) parameter.Unbind();
                }
            }
        }
        this.passes = [];
    }

    /**
     * Binds parameters
     * @returns {boolean}
     */
    BindParameters()
    {
        this.UnbindParameters();

        if (!this.IsGood()) return false;

        for (let i = 0; i < this.effectRes.passes.length; ++i)
        {
            const pass = [];
            pass.stages = [];
            for (let j = 0; j < this.effectRes.passes[i].stages.length; ++j)
            {
                let stageRes = this.effectRes.passes[i].stages[j];
                let stage = {};
                stage.constantBuffer = new Float32Array(stageRes.constantSize);
                stage.reroutedParameters = [];
                stage.parameters = [];
                stage.textures = [];
                stage.constantBuffer.set(stageRes.constantValues);

                for (let k = 0; k < stageRes.constants.length; ++k)
                {
                    if (Tw2Effect.ConstantIgnore.includes(stageRes.constants[k].name)) continue;

                    const
                        constant = stageRes.constants[k],
                        name = constant.name;

                    if (name in this.parameters)
                    {
                        const param = this.parameters[name];
                        if (param.Bind(stage.constantBuffer, constant.offset, constant.size))
                        {
                            stage.reroutedParameters.push(param);
                        }
                        else
                        {
                            const p = {};
                            p.parameter = param;
                            p.constantBuffer = stage.constantBuffer;
                            p.offset = constant.offset;
                            p.size = constant.size;
                            stage.parameters.push(p);
                        }
                    }
                    else if (store.HasVariable(name))
                    {
                        const p = {};
                        p.parameter = store.GetVariable(name);
                        p.constantBuffer = stage.constantBuffer;
                        p.offset = constant.offset;
                        p.size = constant.size;
                        stage.parameters.push(p);
                    }
                    else if (constant.isAutoregister)
                    {
                        const variable = store.RegisterVariable(name, undefined, constant.Type);
                        if (variable)
                        {
                            const p = {};
                            p.parameter = variable;
                            p.constantBuffer = stage.constantBuffer;
                            p.offset = constant.offset;
                            p.size = constant.size;
                            stage.parameters.push(p);
                        }
                    }
                    else if (this.autoParameter && constant.elements === 1)
                    {
                        let value = stageRes.constantValues.subarray(constant.offset, constant.offset + constant.size),
                            param = store.CreateType(name, value, constant.Type);

                        // Parameter is not on/ enabled by default
                        if (!param)
                        {
                            const Type = store.GetTypeFromValue(constant.size === 1 ? 1 : new Array(constant.size));
                            if (Type) param = new Type(name);
                        }

                        if (param)
                        {
                            console.dir(param);
                            this.parameters[name] = param;
                            const p = {};
                            p.parameter = param;
                            p.constantBuffer = stage.constantBuffer;
                            p.offset = constant.offset;
                            p.size = constant.size;
                            stage.parameters.push(p);
                        }
                    }
                }

                for (let k = 0; k < stageRes.textures.length; ++k)
                {
                    const name = stageRes.textures[k].name;
                    let param;

                    if (name in this.parameters)
                    {
                        param = this.parameters[name];
                    }
                    else if (store.HasVariable(name))
                    {
                        param = store.GetVariable(name);
                    }
                    else if (stageRes.textures[k].isAutoregister)
                    {
                        param = store.RegisterVariable(name, undefined, Tw2TextureParameter);
                    }
                    else if (this.autoParameter)
                    {
                        this.parameters[name] = new Tw2TextureParameter(name);
                        param = this.parameters[name];
                    }
                    else
                    {
                        continue;
                    }

                    const p = {};
                    p.parameter = param;
                    p.slot = stageRes.textures[k].registerIndex;
                    p.sampler = null;

                    for (let n = 0; n < stageRes.samplers.length; ++n)
                    {
                        if (stageRes.samplers[n].registerIndex === p.slot)
                        {
                            if (stageRes.samplers[n].name in this.samplerOverrides)
                            {
                                p.sampler = this.samplerOverrides[stageRes.samplers[n].name].GetSampler(stageRes.samplers[n]);
                            }
                            else
                            {
                                p.sampler = stageRes.samplers[n];
                            }
                            break;
                        }
                    }

                    if (j === 0) p.slot += 12;
                    stage.textures.push(p);
                }
                pass.stages.push(stage);
            }
            this.passes.push(pass);
        }

        if (device['effectObserver'])
        {
            device['effectObserver']['OnEffectChanged'](this);
        }

        return true;
    }

    /**
     * ApplyPass
     * @param pass
     */
    ApplyPass(pass)
    {
        if (!this.IsGood() || pass >= this.passes.length) return;

        this.effectRes.ApplyPass(pass);

        const
            p = this.passes[pass],
            rp = this.effectRes.passes[pass],
            d = device;

        const program = (d.IsAlphaTestEnabled() && rp.shadowShaderProgram) ? rp.shadowShaderProgram : rp.shaderProgram;

        for (let i = 0; i < 2; ++i)
        {
            const stages = p.stages[i];

            for (let j = 0; j < stages.parameters.length; ++j)
            {
                let pp = stages.parameters[j];
                pp.parameter.Apply(pp.constantBuffer, pp.offset, pp.size);
            }

            for (let j = 0; j < stages.textures.length; ++j)
            {
                let tex = stages.textures[j];
                tex.parameter.Apply(tex.slot, tex.sampler, program.volumeSlices[tex.sampler.registerIndex]);
            }
        }

        const cbh = program.constantBufferHandles;
        if (cbh[0]) d.gl.uniform4fv(cbh[0], p.stages[0].constantBuffer);
        if (cbh[7]) d.gl.uniform4fv(cbh[7], p.stages[1].constantBuffer);
        if (d.perFrameVSData && cbh[1]) d.gl.uniform4fv(cbh[1], d.perFrameVSData.data);
        if (d.perFramePSData && cbh[2]) d.gl.uniform4fv(cbh[2], d.perFramePSData.data);
        if (d.perObjectData) d.perObjectData.SetPerObjectDataToDevice(cbh);
    }

    /**
     * GetPassCount
     * @returns {number}
     */
    GetPassCount()
    {
        return this.IsGood() ? this.passes.length : 0;
    }

    /**
     * GetPassInput
     * @param {number} pass
     * @returns {*}
     */
    GetPassInput(pass)
    {
        if (!this.IsGood() || pass >= this.passes.length) return null;

        if (device.IsAlphaTestEnabled() && this.effectRes.passes[pass].shadowShaderProgram)
        {
            return this.effectRes.passes[pass].shadowShaderProgram.input;
        }
        else
        {
            return this.effectRes.passes[pass].shaderProgram.input;
        }
    }

    /**
     * Render
     * @param {function} cb - callback
     */
    Render(cb)
    {
        const count = this.GetPassCount();
        for (let i = 0; i < count; ++i)
        {
            this.ApplyPass(i);
            cb(this, i);
        }
    }

    /**
     * Gets an object containing effect's texture resource paths
     * @param {{}} [out={}]
     * @returns {Object.<string, string>} out
     */
    GetTextures(out = {})
    {
        for (let key in this.parameters)
        {
            if (this.parameters.hasOwnProperty(key) && this.parameters[key] instanceof Tw2TextureParameter)
            {
                let resourcePath = this.parameters[key].GetValue();
                if (resourcePath) out[key] = resourcePath;
            }
        }
        return out;
    }

    /**
     * Sets textures from an object
     * @param {{string:string}} options
     * @returns {boolean} true if updated
     */
    SetTextures(options = {})
    {
        let updated = false,
            rebindParameters = false;

        for (let key in options)
        {
            if (options.hasOwnProperty(key))
            {
                if (key in this.parameters)
                {
                    if (this.parameters.SetValue(options[key])) updated = true;
                }
                else
                {
                    this.parameters[key] = new Tw2TextureParameter(key, options[key]);
                    updated = true;
                    rebindParameters = true;
                }
            }
        }

        if (this.IsGood() && rebindParameters) this.BindParameters();
        return updated;
    }

    /**
     * Gets an object containing all non texture parameters values
     * - Matches sof parameter object
     * @param {{}} [out={}]
     * @returns {Object.<string, *>}
     */
    GetParameters(out = {})
    {
        for (let key in this.parameters)
        {
            if (this.parameters.hasOwnProperty(key) && !(this.parameters[key] instanceof Tw2TextureParameter))
            {
                out[key] = this.parameters[key].GetValue(true);
            }
        }
        return out;
    }

    /**
     * Sets parameters from an object
     * @param {{string:*}} [options={}]
     * @returns {boolean} true if updated
     */
    SetParameters(options = {})
    {
        let updated = false,
            rebindParameters = false;

        for (let key in options)
        {
            if (options.hasOwnProperty(key))
            {
                if (key in this.parameters)
                {
                    if (this.parameters[key].SetValue(options[key])) updated = true;
                }
                else
                {
                    const parameter = store.CreateType(key, options[key]);
                    if (parameter)
                    {
                        this.parameters[key] = parameter;
                        rebindParameters = true;
                        updated = true;
                    }
                }
            }
        }

        if (rebindParameters) this.BindParameters();
        return updated;
    }

    /**
     * Sets texture overrides from an object
     * @param {*} options
     * @returns {boolean} true if updated
     */
    SetOverrides(options = {})
    {
        let updated = false;
        for (let key in options)
        {
            if (options.hasOwnProperty(key) && key in this.parameters && 'SetOverrides' in this.parameters[key])
            {
                this.parameters[key].SetOverrides(options[key]);
                updated = true;
            }
        }
        return updated;
    }

    /**
     * Gets texture overrides as an object
     * @param {{ string: {}}} out
     */
    GetOverrides(out = {})
    {
        for (let key in this.parameters)
        {
            if (this.parameters.hasOwnProperty(key) && 'GetOverrides' in this.parameters[key])
            {
                if (this.parameters[key].useAllOverrides)
                {
                    out[key] = this.parameters[key].GetOverrides();
                }
            }
        }
        return out;
    }

    /**
     * Converts a effect file path into one suitable for an effect resource
     * @param {string} path
     * @returns {string}
     */
    static ToEffectResPath(path)
    {
        return path ? path.substr(0, path.lastIndexOf('.')).replace('/effect/', device.effectDir) + '.sm_' + device.shaderModel : '';
    }

    /**
     * Converts an effect resource path back into a normal effect file path
     * @param {string} path
     * @param {string} [ext='fx']
     * @returns {string}
     */
    static FromEffectResPath(path, ext = 'fx')
    {
        return path.substr(0, path.lastIndexOf('.')).replace(device.effectDir, '/effect/') + '.' + ext;
    }

    /**
     * Creates a Tw2Effect from an object
     * @param {{}} [opt={}]
     * @param {string} [opt.name='']
     * @param {string} [opt.effectFilePath='']
     * @param {boolean} [opt.autoParameter]
     * @param {{string: *}} [opt.parameters]
     * @param {{string: string}} [opt.textures]
     * @param {{string: {}}} [opt.overrides]
     * @returns {Tw2Effect}
     */
    static create(opt = {})
    {
        const effect = new Tw2Effect();
        if (opt.name) effect.name = opt.name;
        if (opt.effectFilePath) effect.effectFilePath = opt.effectFilePath;
        if (opt.parameters) effect.SetParameters(opt.parameters);
        if (opt.textures) effect.SetTextures(opt.textures);
        if (opt.overrides) effect.SetOverrides(opt.overrides);
        if ('autoParameter' in opt) effect.autoParameter = (opt.autoParameter);
        effect.Initialize();
        return effect;
    }
}

/**
 * Constant parameters which are ignored when creating an effect
 * @type {string[]}
 */
Tw2Effect.ConstantIgnore = [
    'PerFrameVS',
    'PerObjectVS',
    'PerFramePS',
    'PerObjectPS',
    'PerObjectPSInt'
];

