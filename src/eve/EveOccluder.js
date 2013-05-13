function EveOccluder()
{
    this.name = '';
    this.display = true;
    this.value = 1;
    this.sprites = [];
    variableStore.RegisterType('OccluderValue', Tw2Vector4Parameter);

    if (!EveOccluder._collectEffect)
    {
        EveOccluder._collectEffect = new Tw2Effect();
        EveOccluder._collectEffect.effectFilePath = 'res:/graphics/effect/managed/space/specialfx/lensflares/collectsamples.fx';
        var param = new Tw2TextureParameter();
        param.name = 'BackBuffer';
        EveOccluder._collectEffect.parameters[param.name] = param;
        var param = new Tw2Vector4Parameter();
        param.name = 'OccluderPosition';
        EveOccluder._collectEffect.parameters[param.name] = param;
        var param = new Tw2Vector3Parameter();
        param.name = 'OccluderIndex';
        EveOccluder._collectEffect.parameters[param.name] = param;
        EveOccluder._collectEffect.Initialize();
        EveOccluder._vertexBuffer = null;
        EveOccluder._decl = new Tw2VertexDeclaration();
        EveOccluder._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_POSITION, 0, device.gl.FLOAT, 2, 0));
        EveOccluder._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 2, 8));
        EveOccluder._decl.RebuildHash();

        var vb = new Float32Array(255 * 6 * 4);
        var index = 0;
        for (var i = 0; i < 16; ++i)
        {
            for (var j = 0; j < 16; ++j)
            {
                var x = (i + Math.random()) / 16 * 2 - 1;
                var y = (j + Math.random()) / 16 * 2 - 1;
                vb[index++] = 1; vb[index++] = 1;
                vb[index++] = x; vb[index++] = y;
                vb[index++] = -1; vb[index++] = 1;
                vb[index++] = x; vb[index++] = y;
                vb[index++] = 1; vb[index++] = -1;
                vb[index++] = x; vb[index++] = y;

                vb[index++] = -1; vb[index++] = 1;
                vb[index++] = x; vb[index++] = y;
                vb[index++] = 1; vb[index++] = -1;
                vb[index++] = x; vb[index++] = y;
                vb[index++] = -1; vb[index++] = -1;
                vb[index++] = x; vb[index++] = y;
            }
        }
        EveOccluder._vertexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, EveOccluder._vertexBuffer);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, vb, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);
    }
}

EveOccluder.prototype.UpdateValue = function (parentTransform, index)
{
    if (!this.display)
    {
        return;
    }
    if (!device.alphaBlendBackBuffer)
    {
        return;
    }

    var batches = new Tw2BatchAccumulator();
    for (var i = 0; i < this.sprites.length; ++i)
    {
        this.sprites[i].UpdateViewDependentData(parentTransform);
        this.sprites[i].GetBatches(device.RM_DECAL, batches);
    }

    variableStore._variables['OccluderValue'].value.set([(1 << (index * 2)) / 255., (2 << (index * 2)) / 255., 0, 0]);

    batches.Render();

    var worldViewProj = mat4.multiply(device.projection, device.view, mat4.create());
    worldViewProj = mat4.multiply(worldViewProj, this.sprites[0].worldTransform);

    var center = quat4.create([0, 0, 0, 1]);
    mat4.multiplyVec4(worldViewProj, center);
    var x0 = (center[0] / center[3] + 1) * 0.5;
    var y0 = (center[1] / center[3] + 1) * 0.5;

    center[0] = center[1] = 0.5;
    center[2] = 0;
    center[3] = 1;
    mat4.multiplyVec4(worldViewProj, center);
    var x1 = (center[0] / center[3] + 1) * 0.5;
    var y1 = (center[1] / center[3] + 1) * 0.5;
    center[0] = x0;
    center[1] = y0;
    center[2] = x1 - x0;
    center[3] = y1 - y0;

    EveOccluder._collectEffect.parameters['OccluderPosition'].SetValue(center);
};

EveOccluder.prototype.CollectSamples = function (tex, index, total, samples)
{
    var effect = EveOccluder._collectEffect;
    var effectRes = effect.GetEffectRes();
    if (!effectRes.IsGood())
    {
        return;
    }
    effect.parameters['BackBuffer'].textureRes = tex;
    effect.parameters['OccluderIndex'].SetValue([index, total, samples]);
    device.SetStandardStates(device.RM_ADDITIVE);

    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, EveOccluder._vertexBuffer);
    for (var pass = 0; pass < effect.GetPassCount(); ++pass)
    {
        effect.ApplyPass(pass);
        if (!EveOccluder._decl.SetDeclaration(effect.GetPassInput(pass), 16))
        {
            return;
        }
        device.ApplyShadowState();
        device.gl.drawArrays(device.gl.TRIANGLES, 0, 255 * 6);
    }

};