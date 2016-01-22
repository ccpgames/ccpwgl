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
function Tw2SamplerOverride()
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
            if (this.filter == 1)
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
            if (this.filter == 1)
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
            if (this.filter == 3 || this.mipFilter == 3)
            {
                sampler.anisotropy = Math.max(this.maxAnisotropy, 1);
            }
            sampler.samplerType = originalSampler.samplerType;
            sampler.isVolume = originalSampler.isVolume;
            sampler.ComputeHash();
        }
        return sampler;
    }
}


/**
 * Tw2Effect
 * @property {string} name
 * @property {string} effectFilePath
 * @property {Tw2EffectRes|null} effectRes
 * @property {Object.<string, Tw2Parameter>} parameters
 * @property {Array} passes
 * @property {Array} samplerOverrides
 * @constructor
 */
function Tw2Effect()
{
    this.name = '';
    this.effectFilePath = '';
    this.effectRes = null;
    this.parameters = {};
    this.passes = [];
    this.samplerOverrides = [];
}

/**
 * Initializes the Tw2Effect
 * @prototype
 */
Tw2Effect.prototype.Initialize = function()
{
    if (this.effectFilePath != '')
    {
        var path = this.effectFilePath;
        var dot = path.lastIndexOf('.');
        var ext = path.substr(dot);
        path = path.toLowerCase().substr(0, dot).replace("/effect/", device.effectDir) + ".sm_" + device.shaderModel;
        this.effectRes = resMan.GetResource(path);
        this.effectRes.RegisterNotification(this);
    }
};

/**
 * Returns the Tw2Effect's resource object
 * @prototype
 */
Tw2Effect.prototype.GetEffectRes = function()
{
    return this.effectRes;
};

/**
 * Rebuilds Cached Data
 * @param resource
 * @prototype
 */
Tw2Effect.prototype.RebuildCachedData = function(resource)
{
    if (resource.IsGood())
    {
        this.BindParameters();
    }
};

/**
 * BindParameters
 * @returns {boolean}
 * @prototype
 */
Tw2Effect.prototype.BindParameters = function()
{
    if (this.effectRes == null || !this.effectRes.IsGood())
    {
        return false;
    }

    for (var i = 0; i < this.passes.length; ++i)
    {
        for (var j = 0; j < this.passes[i].stages.length; ++j)
        {
            for (var k = 0; k < this.passes[i].stages[j].reroutedParameters.length; ++k)
            {
                this.passes[i].stages[j].reroutedParameters[k].Unbind();
            }
        }
    }
    this.passes = [];
    for (var i = 0; i < this.effectRes.passes.length; ++i)
    {
        var pass = [];
        pass.stages = [];
        for (var j = 0; j < this.effectRes.passes[i].stages.length; ++j)
        {
            var stageRes = this.effectRes.passes[i].stages[j];
            var stage = {};
            stage.constantBuffer = new Float32Array(stageRes.constantSize);
            stage.reroutedParameters = [];
            stage.parameters = [];
            stage.textures = [];
            stage.constantBuffer.set(stageRes.constantValues);

            for (var k = 0; k < stageRes.constants.length; ++k)
            {
                var constant = stageRes.constants[k];
                var name = constant.name;
                if (name == 'PerFrameVS' ||
                    name == 'PerObjectVS' ||
                    name == 'PerFramePS' ||
                    name == 'PerObjectPS' ||
                    name == 'PerObjectPSInt')
                {
                    continue;
                }
                if (name in this.parameters)
                {
                    var param = this.parameters[name];
                    if (param.Bind(stage.constantBuffer, constant.offset, constant.size))
                    {
                        stage.reroutedParameters.push(param);
                    }
                    else
                    {
                        var p = {};
                        p.parameter = param;
                        p.constantBuffer = stage.constantBuffer;
                        p.offset = constant.offset;
                        p.size = constant.size;
                        stage.parameters.push(p);
                    }
                }
                else if (name in variableStore._variables)
                {
                    var param = variableStore._variables[name];
                    var p = {};
                    p.parameter = param;
                    p.constantBuffer = stage.constantBuffer;
                    p.offset = constant.offset;
                    p.size = constant.size;
                    stage.parameters.push(p);
                }
                else if (constant.isAutoregister)
                {
                    variableStore.RegisterType(name, constant.type);
                    var param = variableStore._variables[name];
                    var p = {};
                    p.parameter = param;
                    p.constantBuffer = stage.constantBuffer;
                    p.offset = constant.offset;
                    p.size = constant.size;
                    stage.parameters.push(p);
                }
            }

            for (var k = 0; k < stageRes.textures.length; ++k)
            {
                var name = stageRes.textures[k].name;
                var param = null;
                if (name in this.parameters)
                {
                    param = this.parameters[name];
                }
                else if (name in variableStore._variables)
                {
                    param = variableStore._variables[name];
                }
                else if (stageRes.textures[k].isAutoregister)
                {
                    variableStore.RegisterType(name, Tw2TextureParameter);
                    param = variableStore._variables[name];
                }
                else
                {
                    continue;
                }
                var p = {};
                p.parameter = param;
                p.slot = stageRes.textures[k].registerIndex;
                p.sampler = null;
                for (var n = 0; n < stageRes.samplers.length; ++n)
                {
                    if (stageRes.samplers[n].registerIndex == p.slot)
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
                if (j == 0)
                {
                    p.slot += 12;
                }
                stage.textures.push(p);
            }
            pass.stages.push(stage);
        }
        this.passes.push(pass);
    }
    if (device.effectObserver)
    {
        device.effectObserver.OnEffectChanged(this);
    }
    return true;
};

/**
 * ApplyPass
 * @param pass
 * @prototype
 */
Tw2Effect.prototype.ApplyPass = function(pass)
{
    if (this.effectRes == null || !this.effectRes.IsGood() || pass >= this.passes.length)
    {
        return;
    }

    this.effectRes.ApplyPass(pass);
    var p = this.passes[pass];
    var rp = this.effectRes.passes[pass];
    var d = device;
    if (d.IsAlphaTestEnabled() && rp.shadowShaderProgram)
    {
        var program = rp.shadowShaderProgram;
    }
    else
    {
        var program = rp.shaderProgram;
    }
    for (var i = 0; i < 2; ++i)
    {
        var stages = p.stages[i];
        for (var j = 0; j < stages.parameters.length; ++j)
        {
            var pp = stages.parameters[j];
            pp.parameter.Apply(pp.constantBuffer, pp.offset, pp.size);
        }
        for (var j = 0; j < stages.textures.length; ++j)
        {
            var tex = stages.textures[j];
            tex.parameter.Apply(tex.slot, tex.sampler, program.volumeSlices[tex.sampler.registerIndex]);
        }
    }
    if (program.constantBufferHandles[0] != null)
    {
        d.gl.uniform4fv(program.constantBufferHandles[0], p.stages[0].constantBuffer);
    }
    if (program.constantBufferHandles[7] != null)
    {
        d.gl.uniform4fv(program.constantBufferHandles[7], p.stages[1].constantBuffer);
    }
    if (device.perFrameVSData && program.constantBufferHandles[1])
    {
        d.gl.uniform4fv(program.constantBufferHandles[1], d.perFrameVSData.data);
    }
    if (device.perFramePSData && program.constantBufferHandles[2])
    {
        d.gl.uniform4fv(program.constantBufferHandles[2], d.perFramePSData.data);
    }
    if (d.perObjectData)
    {
        d.perObjectData.SetPerObjectDataToDevice(program.constantBufferHandles);
    }
};

/**
 * GetPassCount
 * @returns {number}
 * @prototype
 */
Tw2Effect.prototype.GetPassCount = function()
{
    if (this.effectRes == null || !this.effectRes.IsGood())
    {
        return 0;
    }
    return this.passes.length;
};

/**
 * GetPassInput
 * @param {number} pass
 * @returns {?}
 * @prototype
 */
Tw2Effect.prototype.GetPassInput = function(pass)
{
    if (this.effectRes == null || !this.effectRes.IsGood() || pass >= this.passes.length)
    {
        return null;
    }
    if (device.IsAlphaTestEnabled() && this.effectRes.passes[pass].shadowShaderProgram)
    {
        return this.effectRes.passes[pass].shadowShaderProgram.input;
    }
    else
    {
        return this.effectRes.passes[pass].shaderProgram.input;
    }
};

/**
 * Render
 * @param {function} cb - callback
 * @prototype
 */
Tw2Effect.prototype.Render = function(cb)
{
    var count = this.GetPassCount();
    for (var i = 0; i < count; ++i)
    {
        this.ApplyPass(i);
        cb(this, i);
    }
};


/**
 * Gets an object containing the textures currently set in the Tw2Effect
 * - Matches sof texture objects
 * @returns {Object.<string, Tw2TextureParameter>}
 * @prototype
 */
Tw2Effect.prototype.GetTextures = function()
{
    var textures = {};

    for (var param in this.parameters)
    {
        if (this.parameters.hasOwnProperty(param) && this.parameters[param] instanceof Tw2TextureParameter)
        {
            textures[param] = this.parameters[param].resourcePath;
        }
    }

    return textures;
};

/**
 * Gets an object containing all non texture parameters currently set in the Tw2Effect
 * - Matches sof parameter object
 * @returns {Object.<string, Tw2FloatParameter|Tw2Vector2Parameter|Tw2Vector3Parameter|Tw2Vector4Parameter|Tw2VariableParameter>}
 * @prototype
 */
Tw2Effect.prototype.GetParameters = function()
{
    var parameters = {};

    for (var param in this.parameters)
    {
        if (this.parameters.hasOwnProperty(param) && !(this.parameters[param] instanceof Tw2TextureParameter))
        {
            if (!(this.parameters[param] instanceof Tw2VariableParameter))
            {
                parameters[param] = this.parameters[param].GetValue();
            }
            else
            {
                parameters[param] = this.parameters[param].variableName;
            }
        }
    }

    return parameters;
};
