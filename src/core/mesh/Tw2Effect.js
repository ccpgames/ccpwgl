import {util} from '../../math';
import {resMan, device, store} from '../global';
import {Tw2TextureParameter} from '../parameter/Tw2TextureParameter';

/**
 * Tw2Effect
 *
 * @property {string|number} _id
 * @property {string} name
 * @property {string} effectFilePath
 * @property {Tw2EffectRes|null} effectRes
 * @property {Object.<string, Tw2Parameter>} parameters
 * @property {Object.<string, Array>} techniques
 * @property {Object.<string, string>} options
 * @property {Tw2Shader|null} shader
 * @property {Array} samplerOverrides
 * @property {boolean} autoParameter
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
        this.techniques = [];
        this.samplerOverrides = [];
        this.autoParameter = false;
        this.options = {};
        this.shader = null;
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
     * Checks if the effect's resource is good
     * @returns {boolean}
     */
    IsGood()
    {
        return this.shader !== null;
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
     * Rebuilds Cached Data
     * @param resource
     */
    RebuildCachedData(resource)
    {
        this.shader = resource.GetShader(this.options);
        this.BindParameters();
    }

    /**
     * Unbinds parameters
     * @returns {boolean}
     */
    UnBindParameters()
    {
        for (let t in this.techniques)
        {
            if (this.techniques.hasOwnProperty(t))
            {
                let technique = this.techniques[t];
                for (let i = 0; i < technique.length; ++i)
                {
                    for (let j = 0; j < technique[i].stages.length; ++j)
                    {
                        for (let k = 0; k < technique[i].stages[j].reroutedParameters.length; ++k)
                        {
                            technique[i].stages[j].reroutedParameters[k].Unbind();
                        }
                    }
                }
            }
        }
        this.techniques = {};
    }

    /**
     * Binds parameters
     * @returns {boolean}
     */
    BindParameters()
    {
        this.UnBindParameters();
        if (!this.IsGood())
        {
            return false;
        }

        for (let techniqueName in this.shader.techniques)
        {
            if (this.shader.techniques.hasOwnProperty(techniqueName))
            {
                let technique = this.shader.techniques[techniqueName];
                let passes = [];

                for (let i = 0; i < technique.passes.length; ++i)
                {
                    const pass = [];
                    pass.stages = [];
                    for (let j = 0; j < technique.passes[i].stages.length; ++j)
                    {
                        const
                            stageRes = technique.passes[i].stages[j],
                            stage = {};

                        stage.constantBuffer = new Float32Array(stageRes.constantSize);
                        stage.reroutedParameters = [];
                        stage.parameters = [];
                        stage.textures = [];
                        stage.constantBuffer.set(stageRes.constantValues);

                        for (let k = 0; k < stageRes.constants.length; ++k)
                        {
                            const
                                constant = stageRes.constants[k],
                                name = constant.name,
                                Type = constant.Type;

                            if (Tw2Effect.ConstantIgnore.includes(name)) continue;

                            if (name in this.parameters)
                            {
                                const param = this.parameters[name];
                                if (param.Bind(stage.constantBuffer, constant.offset, constant.size))
                                {
                                    stage.reroutedParameters.push(param);
                                }
                                else
                                {
                                    stage.parameters.push({
                                        parameter: param,
                                        constantBuffer: stage.constantBuffer,
                                        offset: constant.offset,
                                        size: constant.size
                                    });
                                }
                            }
                            else if (store.HasVariable(name))
                            {
                                stage.parameters.push({
                                    parameter: store.GetVariable(name),
                                    constantBuffer: stage.constantBuffer,
                                    offset: constant.offset,
                                    size: constant.size
                                });
                            }
                            else if (constant.isAutoregister && Type)
                            {
                                const variable = store.RegisterVariable(name, undefined, Type);
                                if (variable)
                                {
                                    stage.parameters.push({
                                        parameter: variable,
                                        constantBuffer: stage.constantBuffer,
                                        offset: constant.offset,
                                        size: constant.size
                                    });
                                }
                            }
                            else if (this.autoParameter && constant.elements === 1)
                            {
                                let value = stage.constantBuffer.subarray(constant.offset, constant.offset + constant.size);
                                if (value.length === 0)
                                {
                                    value = undefined;
                                }
                                else if (value.length === 1)
                                {
                                    value = value[0];
                                }

                                const param = store.CreateType(name, value, Type);
                                if (param)
                                {
                                    this.parameters[name] = param;
                                    if (param.Bind(stage.constantBuffer, constant.offset, constant.size))
                                    {
                                        stage.reroutedParameters.push(param);
                                    }
                                    else
                                    {
                                        stage.parameter.push({
                                            parameter: param,
                                            constantBuffer: stage.constantBuffer,
                                            offset: constant.offset,
                                            size: constant.size
                                        });
                                    }
                                }
                            }
                        }

                        for (let k = 0; k < stageRes.textures.length; ++k)
                        {
                            const name = stageRes.textures[k].name;
                            let param = null;
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
                                param = this.parameters[name] = new Tw2TextureParameter(name);
                            }
                            else
                            {
                                continue;
                            }

                            const p = {
                                parameter : param,
                                slot: stageRes.textures[k].registerIndex,
                                sampler: null
                            };

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
                    passes.push(pass);
                }
                this.techniques[techniqueName] = passes;
            }
        }

        if (device['effectObserver'])
        {
            device['effectObserver']['OnEffectChanged'](this);
        }

        this.autoParameter = false;
        return true;
    }

    /**
     * ApplyPass
     * @param technique {string} - technique name
     * @param pass {number}
     */
    ApplyPass(technique, pass)
    {
        if (!this.IsGood() || !(technique in this.techniques) || pass >= this.techniques[technique].length)
        {
            return;
        }

        this.shader.ApplyPass(technique, pass);

        const
            p = this.techniques[technique][pass],
            rp = this.shader.techniques[technique].passes[pass],
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
     * @param technique {string} - technique name
     * @returns {number}
     */
    GetPassCount(technique)
    {
        if (this.shader === null || !(technique in this.techniques))
        {
            return 0;
        }
        return this.techniques[technique].length;
    }

    /**
     * GetPassInput
     * @param technique {string} - technique name
     * @param {number} pass
     * @returns {*}
     */
    GetPassInput(technique, pass)
    {
        if (this.shader === null || !(technique in this.techniques) || pass >= this.techniques[technique].length)
        {
            return null;
        }

        if (device.IsAlphaTestEnabled() && this.shader.techniques[technique].passes[pass].shadowShaderProgram)
        {
            return this.shader.techniques[technique].passes[pass].shadowShaderProgram.input;
        }
        else
        {
            return this.shader.techniques[technique].passes[pass].shaderProgram.input;
        }
    }

    /**
     * Render
     * @param {function} cb - callback
     */
    Render(cb)
    {
        const count = this.GetPassCount('Main');
        for (let i = 0; i < count; ++i)
        {
            this.ApplyPass('Main', i);
            cb(this, i);
        }
    }

    /**
     * Gets an object containing the textures currently set in the Tw2Effect
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
                if (resourcePath)
                {
                    out[key] = resourcePath;
                }
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
        let updated = false;
        for (let key in options)
        {
            if (options.hasOwnProperty(key))
            {
                const
                    value = options[key],
                    param = this.parameters[key];

                if (Tw2TextureParameter.is(value))
                {
                    if (param)
                    {
                        if (!param.EqualsValue(value))
                        {
                            param.SetTexturePath(value);
                            updated = true;
                        }
                    }
                    else
                    {
                        this.parameters[key] = new Tw2TextureParameter(key, value);
                        updated = true;
                    }
                }
            }
        }

        return updated;
    }

    /**
     * Gets an object containing all non texture parameters currently set in the Tw2Effect
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
        let updated = false;
        for (let key in options)
        {
            if (options.hasOwnProperty(key))
            {
                const
                    value = options[key],
                    param = this.parameters[key];

                if (param)
                {
                    if (param.constructor.is(value) && !param.EqualsValue(value))
                    {
                        this.parameters[key].SetValue(value);
                        updated = true;
                    }
                }
                else
                {
                    const parameter = store.CreateType(key, value);
                    if (parameter)
                    {
                        this.parameters[key] = parameter;
                        updated = true;
                    }
                }
            }
        }

        return updated;
    }

    /**
     * Sets texture overrides
     * @param {*} [options={}]
     * @returns {boolean} true if updated
     */
    SetOverrides(options = {})
    {
        let updated = false;
        for (let key in options)
        {
            if (options.hasOwnProperty(key))
            {
                const param = this.parameters[key];
                if (param && param instanceof Tw2TextureParameter)
                {
                    let doUpdate = false;

                    const overrides = options[key];
                    for (let prop in overrides)
                    {
                        if (overrides.hasOwnProperty(prop) && Tw2TextureParameter.overrideProperties.includes(prop))
                        {
                            if (overrides[prop] !== param[prop])
                            {
                                doUpdate = true;
                                break;
                            }
                        }
                    }

                    if (doUpdate)
                    {
                        param.SetOverrides(options[key]);
                        updated = true;
                    }
                }
            }
        }
        return updated;
    }

    /**
     * Gets texture overrides
     * @param {{ string: {}}} [out={}]
     */
    GetOverrides(out = {})
    {
        for (let key in this.parameters)
        {
            if (this.parameters.hasOwnProperty(key))
            {
                const param = this.parameters[key];
                if (param && param instanceof Tw2TextureParameter && param.useAllOverrides)
                {
                    out[key] = this.parameters[key].GetOverrides();
                }
            }
        }
        return out;
    }


    /**
     * Converts an effect file path into one suitable for an effect resource
     * @param {string} path
     * @returns {string}
     */
    static ToEffectResPath(path)
    {
        path = path ? path.substr(0, path.lastIndexOf('.')).replace('/effect/', device.effectDir) + '.sm_' + device.shaderModel : '';
        return path.toLowerCase();
    }

    /**
     * Converts an effect resource path back into a normal effect file path
     * @param {string} path
     * @param {string} [ext='fx']
     * @returns {string}
     */
    static FromEffectResPath(path, ext = 'fx')
    {
        path = path.substr(0, path.lastIndexOf('.')).replace(device.effectDir, '/effect/') + '.' + ext;
        return path.toLowerCase();
    }
    
    /**
     * Creates a Tw2Effect from an object
     * @param {{}} [opt]
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
        const effect = new this();
        util.assignIfExists(effect, opt, ['name', 'effectFilePath', 'display', 'autoParameter', ]);
        if ('parameters' in opt) effect.SetParameters(opt.parameters);
        if ('textures' in opt) effect.SetTextures(opt.textures);
        if ('overrides' in opt) effect.SetOverrides(opt.overrides);

        if (effect.name === '' && opt.effectFilePath !== '')
        {
            let path = opt.effectFilePath;
            effect.name = path.substring(path.lastIndexOf('/') + 1, path.length);
        }

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

