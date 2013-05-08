function EveBoosterSet()
{
    this.display = true;
    this.effect = null;
    this.glows = null;
    this.glowScale = 1.0;
    this.glowColor = [0, 0, 0, 0];
    this.symHaloScale = 1.0;
    this.haloScaleX = 1.0;
    this.haloScaleY = 1.0;
    this.maxVel = 250;
    this.haloColor = [0, 0, 0, 0];
    this.alwaysOn = true;
    
    this._parentTransform = mat4.create();
    this._wavePhase = [];
    this._boosterTransforms = [];
    
    this._positions = device.gl.createBuffer();
    
    this._decl = new Tw2VertexDeclaration();
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_POSITION, 0, device.gl.FLOAT, 3, 0));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 2, 12));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 4, 20));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 2, device.gl.FLOAT, 4, 36));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 3, device.gl.FLOAT, 4, 52));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 4, device.gl.FLOAT, 4, 68));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 5, device.gl.FLOAT, 1, 84));
    this._decl.RebuildHash();
    
    this._perObjectData = new Tw2PerObjectData();
    this._perObjectData.perObjectVSData = new Tw2RawData();
    this._perObjectData.perObjectVSData.Declare('WorldMat', 16);
    this._perObjectData.perObjectVSData.Declare('Shipdata', 4);
    this._perObjectData.perObjectVSData.Create();
    
    this.rebuildPending = false;
}

EveBoosterSet.prototype.Initialize = function ()
{
    this.rebuildPending = true;
};

EveBoosterSet.prototype.Clear = function ()
{
    this._boosterTransforms = [];
    this._wavePhase = mat4.create();
    if (this.glows)
    {
        this.glows.Clear();
    }
};

EveBoosterSet.prototype.Add = function (localMatrix)
{
    var transform = mat4.create();
    mat4.set(localMatrix, transform);
    this._boosterTransforms[this._boosterTransforms.length] = transform;
    this._wavePhase[this._wavePhase.length] = Math.random();
    if (this.glows)
    {
        var pos = vec3.create([localMatrix[12], localMatrix[13], localMatrix[14]]);
        var dir = vec3.create([localMatrix[8], localMatrix[9], localMatrix[10]]);
        var scale = vec3.length(dir);
        var spritePos = vec3.create();
        vec3.subtract(pos, vec3.scale(dir, 2.5, spritePos), spritePos);
        this.glows.Add(spritePos, 0, 0, scale * this.glowScale, scale * this.glowScale, 0, this.glowColor);
        vec3.subtract(pos, vec3.scale(dir, 3, spritePos), spritePos);
        this.glows.Add(spritePos, 0, 1, scale * this.symHaloScale, scale * this.symHaloScale, 0, this.haloColor);
        vec3.subtract(pos, vec3.scale(dir, 3.01, spritePos), spritePos);
        this.glows.Add(spritePos, 0, 1, scale * this.haloScaleX, scale * this.haloScaleY, 0, this.haloColor);
    }
};

EveBoosterSet.prototype.Rebuild = function ()
{
    var data = new Float32Array(this._boosterTransforms.length * 4 * 6 * 22);
    var order = [
        [-1, -1, 0, 1, 1], 
        [1, 1, -1, 0, 0], 
        [-1, -1, -1, 1, 0],
        [-1, -1, 0, 1, 1],
        [1, 1, 0, 0, 1], 
        [1, 1, -1, 0, 0]];
    var index = 0;
    for (var booster = 0; booster < this._boosterTransforms.length; ++booster)
    {
        var vec = vec3.create();
        for (var i = 0; i < 4; ++i)
        {
            var t = i * Math.PI / 4.0;
            var x = Math.cos(t) * 0.5;
            var y = Math.sin(t) * 0.5;
            for (var j = 0; j < 6; ++j)
            {
                data[index++] = x * order[j][0];
                data[index++] = y * order[j][1];
                data[index++] = order[j][2];
                data[index++] = order[j][3];
                data[index++] = order[j][4];
                data.set(this._boosterTransforms[booster], index);
                index += 16;
                data[index++] = this._wavePhase[booster];
            }
        }
    }
    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._positions);
    device.gl.bufferData(device.gl.ARRAY_BUFFER, data, device.gl.STATIC_DRAW);

    this.rebuildPending = false;
    if (this.glows)
    {
        this.glows.RebuildBuffers();
    }
};

EveBoosterSet.prototype.Update = function (dt, parentMatrix)
{
    if (this.glows)
    {
        this.glows.Update(dt);
    }
    this._parentTransform = parentMatrix;
};

function EveBoosterBatch()
{
	this.renderMode = device.RM_ANY;
	this.perObjectData = null;
	this.boosters = null;
}

EveBoosterBatch.prototype.Commit = function (overrideEffect)
{
    this.boosters.Render(overrideEffect);
};

EveBoosterSet.prototype.GetBatches = function (mode, accumulator, perObjectData)
{
    if (!this.display || mode != device.RM_ADDITIVE)
    {
        return;
    }
    if (this.effect && this._boosterTransforms.length)
    {
        var batch = new EveBoosterBatch();
        
        mat4.transpose(this._parentTransform, this._perObjectData.perObjectVSData.Get('WorldMat'));
        this._perObjectData.perObjectVSData.Set('Shipdata', perObjectData.perObjectVSData.Get('Shipdata'));
        this._perObjectData.perObjectPSData = perObjectData.perObjectPSData;
        batch.perObjectData = this._perObjectData;
        batch.boosters = this;
        batch.renderMode = device.RM_ADDITIVE;
        accumulator.Commit(batch);
    }
    if (this.glows)
    {
        this.glows.GetBatches(mode, accumulator, perObjectData);
    }
};

EveBoosterSet.prototype.Render = function (overrideEffect)
{
    var effect = typeof (overrideEffect) == 'undefined' ? this.effect : overrideEffect;
    var effectRes = effect.GetEffectRes();
    if (!effectRes.IsGood())
    {
        return false;
    }

    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._positions);

    for (var pass = 0; pass < effect.GetPassCount(); ++pass)
    {
        effect.ApplyPass(pass);
        if (!this._decl.SetDeclaration(effect.GetPassInput(pass), 88))
        {
            return false;
        }
        device.ApplyShadowState();
        device.gl.drawArrays(device.gl.TRIANGLES, 0, this._boosterTransforms.length * 8 * 3);
    }
    return true;
};
