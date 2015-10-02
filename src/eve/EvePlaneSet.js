function EvePlaneSet()
{
    this.name = '';
    this.planes = [];
    this.effect = null;
    this.display = true;
    this.hideOnLowQuality = false;

    this._time = 0;

    this._vertexBuffer = null;
    this._indexBuffer = null;
    this._decl = new Tw2VertexDeclaration();
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 4, 0));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 4, 16));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 2, device.gl.FLOAT, 4, 32));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 0, device.gl.FLOAT, 4, 48));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 3, device.gl.FLOAT, 4, 64));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 4, device.gl.FLOAT, 4, 80));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 5, device.gl.FLOAT, 4, 96));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 6, device.gl.FLOAT, 4, 112));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 7, device.gl.FLOAT, 2, 128));
    this._decl.RebuildHash();
}

EvePlaneSet.prototype.Initialize = function ()
{
    this.RebuildBuffers();
};

EvePlaneSet.prototype.RebuildBuffers = function ()
{
    var vertexSize = 34;
    var array = new Float32Array(this.planes.length * 4 * vertexSize);
    var tempMat = mat4.create();
    for (var i = 0; i < this.planes.length; ++i)
    {
        var offset = i * 4 * vertexSize;
        array[offset + vertexSize - 2] = 0;
        array[offset + vertexSize + vertexSize - 2] = 1;
        array[offset + 2 * vertexSize + vertexSize - 2] = 2;
        array[offset + 3 * vertexSize + vertexSize - 2] = 3;

        var itemTransform = mat4.transpose(mat4.multiply(mat4.scale(mat4.identity(mat4.create()), this.planes[i].scaling), quat4.toMat4(this.planes[i].rotation, tempMat)));
        itemTransform[12] = this.planes[i].position[0];
        itemTransform[13] = this.planes[i].position[1];
        itemTransform[14] = this.planes[i].position[2];

        for (var j = 0; j < 4; ++j)
        {
            vtxOffset = offset + j * vertexSize;
            array[vtxOffset + 0] = itemTransform[0];
            array[vtxOffset + 1] = itemTransform[4];
            array[vtxOffset + 2] = itemTransform[8];
            array[vtxOffset + 3] = itemTransform[12];
            array[vtxOffset + 4] = itemTransform[1];
            array[vtxOffset + 5] = itemTransform[5];
            array[vtxOffset + 6] = itemTransform[9];
            array[vtxOffset + 7] = itemTransform[13];
            array[vtxOffset + 8] = itemTransform[2];
            array[vtxOffset + 9] = itemTransform[6];
            array[vtxOffset + 10] = itemTransform[10];
            array[vtxOffset + 11] = itemTransform[14];

            array[vtxOffset + 12] = this.planes[i].color[0];
            array[vtxOffset + 13] = this.planes[i].color[1];
            array[vtxOffset + 14] = this.planes[i].color[2];
            array[vtxOffset + 15] = this.planes[i].color[3];

            array[vtxOffset + 16] = this.planes[i].layer1Transform[0];
            array[vtxOffset + 17] = this.planes[i].layer1Transform[1];
            array[vtxOffset + 18] = this.planes[i].layer1Transform[2];
            array[vtxOffset + 19] = this.planes[i].layer1Transform[3];

            array[vtxOffset + 20] = this.planes[i].layer2Transform[0];
            array[vtxOffset + 21] = this.planes[i].layer2Transform[1];
            array[vtxOffset + 22] = this.planes[i].layer2Transform[2];
            array[vtxOffset + 23] = this.planes[i].layer2Transform[3];

            array[vtxOffset + 24] = this.planes[i].layer1Scroll[0];
            array[vtxOffset + 25] = this.planes[i].layer1Scroll[1];
            array[vtxOffset + 26] = this.planes[i].layer1Scroll[2];
            array[vtxOffset + 27] = this.planes[i].layer1Scroll[3];

            array[vtxOffset + 28] = this.planes[i].layer2Scroll[0];
            array[vtxOffset + 29] = this.planes[i].layer2Scroll[1];
            array[vtxOffset + 30] = this.planes[i].layer2Scroll[2];
            array[vtxOffset + 31] = this.planes[i].layer2Scroll[3];

            array[vtxOffset + 33] = this.boneIndex;
        }
    }
    this._vertexBuffer = device.gl.createBuffer();
    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
    device.gl.bufferData(device.gl.ARRAY_BUFFER, array, device.gl.STATIC_DRAW);
    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);

    var indexes = new Uint16Array(this.planes.length * 6);
    for (i = 0; i < this.planes.length; ++i)
    {
        offset = i * 6;
        var vtxOffset = i * 4;
        indexes[offset] = vtxOffset;
        indexes[offset + 1] = vtxOffset + 2;
        indexes[offset + 2] = vtxOffset + 1;
        indexes[offset + 3] = vtxOffset + 0;
        indexes[offset + 4] = vtxOffset + 3;
        indexes[offset + 5] = vtxOffset + 2;
    }
    this._indexBuffer = device.gl.createBuffer();
    device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, indexes, device.gl.STATIC_DRAW);
    device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, null);
    this._indexBuffer.count = this.planes.length * 6;
};

function EvePlaneSetBatch()
{
    this._super.constructor.call(this);
    this.planeSet = null;
}

EvePlaneSetBatch.prototype.Commit = function (overrideEffect)
{
    this.planeSet.Render(overrideEffect);
};

Inherit(EvePlaneSetBatch, Tw2RenderBatch);


EvePlaneSet.prototype.GetBatches = function (mode, accumulator, perObjectData)
{
    if (this.display && mode == device.RM_ADDITIVE)
    {
        var batch = new EvePlaneSetBatch();
        batch.renderMode = device.RM_ADDITIVE;
        batch.planeSet = this;
        batch.perObjectData = perObjectData;
        accumulator.Commit(batch);
    }
};

EvePlaneSet.prototype.Render = function (overrideEffect)
{
    var effect = typeof (overrideEffect) == 'undefined' ? this.effect : overrideEffect;
    if (!effect || !this._vertexBuffer)
    {
        return;
    }
    var effectRes = effect.GetEffectRes();
    if (!effectRes.IsGood())
    {
        return;
    }
    device.SetStandardStates(device.RM_ADDITIVE);

    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
    device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

    for (var pass = 0; pass < effect.GetPassCount(); ++pass)
    {
        effect.ApplyPass(pass);
        if (!this._decl.SetDeclaration(effect.GetPassInput(pass), 136))
        {
            return;
        }
        device.ApplyShadowState();
        device.gl.drawElements(device.gl.TRIANGLES, this._indexBuffer.count, device.gl.UNSIGNED_SHORT, 0);
    }
};

EvePlaneSet.prototype.Update = function (dt)
{
    this._time += dt;
};

EvePlaneSet.prototype.Clear = function ()
{
    this.planes = [];
};

function EvePlaneSetItem()
{
    this.name = '';
    this.position = vec3.create([0, 0, 0]);
    this.scaling = vec3.create([1, 1, 1]);
    this.rotation = quat4.create([0, 0, 0, 1]);
    this.color = quat4.create([1, 1, 1, 1]);
    this.layer1Transform = quat4.create([1, 1, 0, 0]);
    this.layer2Transform = quat4.create([1, 1, 0, 0]);
    this.layer1Scroll = quat4.create([0, 0, 0, 0]);
    this.layer2Scroll = quat4.create([0, 0, 0, 0]);
    this.boneIndex = 0;
}