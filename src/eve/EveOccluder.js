/**
 * EveOccluder
 * @property {String} name=''
 * @property {boolean} display
 * @property {number} value
 * @property {Array.<EveSpriteSet>} sprites
 * @constructor
 */
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
                vb[index++] = 1;
                vb[index++] = 1;
                vb[index++] = x;
                vb[index++] = y;
                vb[index++] = -1;
                vb[index++] = 1;
                vb[index++] = x;
                vb[index++] = y;
                vb[index++] = 1;
                vb[index++] = -1;
                vb[index++] = x;
                vb[index++] = y;

                vb[index++] = -1;
                vb[index++] = 1;
                vb[index++] = x;
                vb[index++] = y;
                vb[index++] = 1;
                vb[index++] = -1;
                vb[index++] = x;
                vb[index++] = y;
                vb[index++] = -1;
                vb[index++] = -1;
                vb[index++] = x;
                vb[index++] = y;
            }
        }
        EveOccluder._vertexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, EveOccluder._vertexBuffer);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, vb, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);
    }

    var scratch = EveOccluder.scratch;
    if (!scratch.mat4_0)
    {
        scratch.mat4_0 = mat4.create();
        scratch.vec4_0 = quat.create();
        scratch.batches = new Tw2BatchAccumulator();
    }
}

/**
 * Scratch parameters
 */
EveOccluder.scratch = {
    mat4_0: null,
    vec4_0: null,
    batches: null
};

/**
 * UpdateValues
 * @param {mat4} parentTransform
 * @param {number} index
 */
EveOccluder.prototype.UpdateValue = function(parentTransform, index)
{
    if (!this.display)
    {
        return;
    }
    if (!device.alphaBlendBackBuffer)
    {
        return;
    }

    var scratch = EveOccluder.scratch;
    var batches = scratch.batches;
    batches.Clear();

    for (var i = 0; i < this.sprites.length; ++i)
    {
        this.sprites[i].UpdateViewDependentData(parentTransform);
        this.sprites[i].GetBatches(device.RM_DECAL, batches);
    }

    variableStore._variables['OccluderValue'].value.set([(1 << (index * 2)) / 255.0, (2 << (index * 2)) / 255.0, 0, 0]);
    batches.Render();

    var worldViewProj = mat4.copy(scratch.mat4_0, device.viewProjection);
    mat4.multiply(worldViewProj, worldViewProj, this.sprites[0].worldTransform);
    var center = vec4.set(scratch.vec4_0, 0, 0, 0, 1);
    vec4.transformMat4(center, center, worldViewProj);
    var x0 = (center[0] / center[3] + 1) * 0.5;
    var y0 = (center[1] / center[3] + 1) * 0.5;
    center[0] = center[1] = 0.5;
    center[2] = 0;
    center[3] = 1;
    vec4.transformMat4(center, center, worldViewProj);
    var x1 = (center[0] / center[3] + 1) * 0.5;
    var y1 = (center[1] / center[3] + 1) * 0.5;
    center[0] = x0;
    center[1] = y0;
    center[2] = x1 - x0;
    center[3] = y1 - y0;

    EveOccluder._collectEffect.parameters['OccluderPosition'].SetValue(center);
};

/**
 * CollectSamples
 * @param tex
 * @param index
 * @param total
 * @param samples
 */
EveOccluder.prototype.CollectSamples = function(tex, index, total, samples)
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

/**
 * Gets Mesh Overlay resource objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2Res>} [out]
 */
EveOccluder.prototype.GetResources = function(out)
{
    if (out === undefined)
    {
        out = [];
    }

    if (EveOccluder._collectEffect)
    {
        EveOccluder._collectEffect.GetResources(out);
    }

    return out;
};
