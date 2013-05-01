function Tw2Effect()
{
    this.name = '';
    this.effectFilePath = '';
    this.effectRes = null;
	this.parameters = new Object();
	this.passes = [];
}

Tw2Effect.prototype.Initialize = function ()
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

Tw2Effect.prototype.GetEffectRes = function ()
{
    return this.effectRes;
};

Tw2Effect.prototype.RebuildCachedData = function (resource)
{
	if (resource.IsGood())
	{
		this.BindParameters();
	}
};

Tw2Effect.prototype.BindParameters = function ()
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
            var stage = new Object();
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
                        var p = new Object();
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
                    var p = new Object();
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
                    var p = new Object();
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
                var p = new Object();
                p.parameter = param;
                p.slot = stageRes.textures[k].registerIndex;
                p.sampler = null;
                for (var n = 0; n < stageRes.samplers.length; ++n)
                {
                    if (stageRes.samplers[n].registerIndex == p.slot)
                    {
                        p.sampler = stageRes.samplers[n];
                        break;
                    }
                }
                if (j == 0)
                {
                    p.slot += 16;
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

Tw2Effect.prototype.ApplyPass = function (pass)
{
    if (this.effectRes == null || !this.effectRes.IsGood() || pass >= this.passes.length)
    {
        return;
    }

    this.effectRes.ApplyPass(pass);
    var p = this.passes[pass];
    var d = device;
	if (d.IsAlphaTestEnabled() && this.effectRes.passes[pass].shadowShaderProgram)
	{
        var program = this.effectRes.passes[pass].shadowShaderProgram;
	}
	else
	{
        var program = this.effectRes.passes[pass].shaderProgram;
    }
    for (var i = 0; i < 2; ++i)
    {
        for (var j = 0; j < p.stages[i].parameters.length; ++j)
        {
            var pp = p.stages[i].parameters[j];
            pp.parameter.Apply(pp.constantBuffer, pp.offset, pp.size);
        }
        for (var j = 0; j < p.stages[i].textures.length; ++j)
        {
            p.stages[i].textures[j].parameter.Apply(p.stages[i].textures[j].slot, p.stages[i].textures[j].sampler, program.volumeSlices[p.stages[i].textures[j].sampler.registerIndex]);
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

Tw2Effect.prototype.GetPassCount = function ()
{
    if (this.effectRes == null || !this.effectRes.IsGood())
	{
		return 0;
	}
	return this.passes.length;
};

Tw2Effect.prototype.GetPassInput = function (pass)
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


Tw2Effect.prototype.Render = function (cb)
{
    var count = this.GetPassCount();
    for (var i = 0; i < count; ++i)
    {
        this.ApplyPass(i);
        cb(this, i);
    }
};