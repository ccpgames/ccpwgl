/**
 * EvePlaneSet
 * @property {String} name
 * @property {Array.<EvePlaneSetItem>} planes
 * @property {Tw2Effect} effect
 * @property {boolean} display
 * @property {boolean} hideOnLowQuality
 * @property {number} _time
 * @property {WebglBuffer} _vertexBuffer
 * @property {WebglBuffer} _indexBuffer
 * @property {Tw2VertexDeclaration} _decl
 * @constructor
 */
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

/**
 * Initializes the plane set
 */
EvePlaneSet.prototype.Initialize = function()
{
    this.RebuildBuffers();
};

/**
 * Rebuilds the plane set's buffers
 */
EvePlaneSet.prototype.RebuildBuffers = function()
{
    var vertexSize = 34;
    var visibleItems = [];

    for (var n = 0; n < this.planes.length; n++)
    {
        if (this.planes[n].display)
        {
            visibleItems.push(this.planes[n]);
        }
    }

    var array = new Float32Array(visibleItems.length * 4 * vertexSize);
    var tempMat = mat4.create();
    for (var i = 0; i < visibleItems.length; ++i)
    {
        var offset = i * 4 * vertexSize;
        array[offset + vertexSize - 2] = 0;
        array[offset + vertexSize + vertexSize - 2] = 1;
        array[offset + 2 * vertexSize + vertexSize - 2] = 2;
        array[offset + 3 * vertexSize + vertexSize - 2] = 3;

        var itemTransform = mat4.transpose(mat4.multiply(mat4.scale(mat4.identity(mat4.create()), visibleItems[i].scaling), quat4.toMat4(visibleItems[i].rotation, tempMat)));
        itemTransform[12] = visibleItems[i].position[0];
        itemTransform[13] = visibleItems[i].position[1];
        itemTransform[14] = visibleItems[i].position[2];

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

            array[vtxOffset + 12] = visibleItems[i].color[0];
            array[vtxOffset + 13] = visibleItems[i].color[1];
            array[vtxOffset + 14] = visibleItems[i].color[2];
            array[vtxOffset + 15] = visibleItems[i].color[3];

            array[vtxOffset + 16] = visibleItems[i].layer1Transform[0];
            array[vtxOffset + 17] = visibleItems[i].layer1Transform[1];
            array[vtxOffset + 18] = visibleItems[i].layer1Transform[2];
            array[vtxOffset + 19] = visibleItems[i].layer1Transform[3];

            array[vtxOffset + 20] = visibleItems[i].layer2Transform[0];
            array[vtxOffset + 21] = visibleItems[i].layer2Transform[1];
            array[vtxOffset + 22] = visibleItems[i].layer2Transform[2];
            array[vtxOffset + 23] = visibleItems[i].layer2Transform[3];

            array[vtxOffset + 24] = visibleItems[i].layer1Scroll[0];
            array[vtxOffset + 25] = visibleItems[i].layer1Scroll[1];
            array[vtxOffset + 26] = visibleItems[i].layer1Scroll[2];
            array[vtxOffset + 27] = visibleItems[i].layer1Scroll[3];

            array[vtxOffset + 28] = visibleItems[i].layer2Scroll[0];
            array[vtxOffset + 29] = visibleItems[i].layer2Scroll[1];
            array[vtxOffset + 30] = visibleItems[i].layer2Scroll[2];
            array[vtxOffset + 31] = visibleItems[i].layer2Scroll[3];

            array[vtxOffset + 33] = this.boneIndex;
        }
    }
    this._vertexBuffer = device.gl.createBuffer();
    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
    device.gl.bufferData(device.gl.ARRAY_BUFFER, array, device.gl.STATIC_DRAW);
    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);

    var indexes = new Uint16Array(visibleItems.length * 6);
    for (i = 0; i < visibleItems.length; ++i)
    {
        var offset = i * 6;
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
    this._indexBuffer.count = visibleItems.length * 6;
};

/**
 * Plane set render batch
 * @inherits Tw2RenderBatch
 * @constructor
 */
function EvePlaneSetBatch()
{
    this._super.constructor.call(this);
    this.planeSet = null;
}

/**
 * Commits the plan set
 * @param {Tw2Effect} [overrideEffect]
 * @constructor
 */
EvePlaneSetBatch.prototype.Commit = function(overrideEffect)
{
    this.planeSet.Render(overrideEffect);
};

Inherit(EvePlaneSetBatch, Tw2RenderBatch);


/**
 * Gets the plane set's render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 */
EvePlaneSet.prototype.GetBatches = function(mode, accumulator, perObjectData)
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

/**
 * Renders the plane set
 * @param {Tw2Effect} [overrideEffect]
 * @constructor
 */
EvePlaneSet.prototype.Render = function(overrideEffect)
{
    var effect = (!overrideEffect) ? this.effect : overrideEffect;
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

/**
 * Per frame update
 * @param {number} dt - Delta Time
 */
EvePlaneSet.prototype.Update = function(dt)
{
    this._time += dt;
};

/**
 * Clears the plane set's plane items
 */
EvePlaneSet.prototype.Clear = function()
{
    this.planes = [];
};


/**
 * EvePlaneSetItem
 * @property {string} name
 * @property {vec3} position
 * @property {vec3} scaling
 * @property {quat4} rotation
 * @property {quat4} color
 * @property {quat4} layer1Transform
 * @property {quat4} layer2Transform
 * @property {quat4} layer1Scroll
 * @property {quat4} layer2Scroll
 * @property {number} boneIndex
 * @property {number} groupIndex
 * @constructor
 */
function EvePlaneSetItem()
{
    this.display = true;
    this.name = '';
    this.position = vec3.create();
    this.scaling = vec3.create([1, 1, 1]);
    this.rotation = quat4.create([0, 0, 0, 1]);
    this.color = quat4.create([1, 1, 1, 1]);
    this.layer1Transform = quat4.create([1, 1, 0, 0]);
    this.layer2Transform = quat4.create([1, 1, 0, 0]);
    this.layer1Scroll = quat4.create();
    this.layer2Scroll = quat4.create();
    this.boneIndex = 0;
    this.groupIndex = -1;
}
