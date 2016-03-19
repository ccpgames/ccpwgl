/**
 * EveSpriteSet
 * @property {string} name
 * @property {Array.<EveSpriteSetItem>} sprites
 * @property {Tw2Effect} effect
 * @property {boolean} display
 * @property {number} _time
 * @property {WebGlBuffer} _vertexBuffer
 * @property {WebGlBuffer} _indexBuffer
 * @property {Tw2VertexDeclaration} _decl
 * @constructor
 */
function EveSpriteSet()
{
    this.name = '';
    this.sprites = [];
    this.effect = null;
    this.display = true;
    this._time = 0;

    this._vertexBuffer = null;
    this._indexBuffer = null;
    this._decl = new Tw2VertexDeclaration();
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 5, device.gl.FLOAT, 2, 0));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_POSITION, 0, device.gl.FLOAT, 3, 8));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 0, device.gl.FLOAT, 3, 20));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 1, 32));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 1, 36));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 2, device.gl.FLOAT, 1, 40));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 3, device.gl.FLOAT, 1, 44));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 4, device.gl.FLOAT, 1, 48));
    this._decl.RebuildHash();
}

/**
 * Initializes the sprite set
 */
EveSpriteSet.prototype.Initialize = function()
{
    this.RebuildBuffers();
};

/**
 * Rebuilds the sprite set's buffers
 */
EveSpriteSet.prototype.RebuildBuffers = function()
{
    var vertexSize = 13;
    var visibleItems = [];
    for (var i = 0; i < this.sprites.length; i++)
    {
        if (this.sprites[i].display)
        {
            visibleItems.push(this.sprites[i]);
        }
    }

    var array = new Float32Array(visibleItems.length * 4 * vertexSize);
    for (var i = 0; i < visibleItems.length; ++i)
    {
        var offset = i * 4 * vertexSize;
        array[offset + 0 * vertexSize] = 0;
        array[offset + 1 * vertexSize] = 1;
        array[offset + 2 * vertexSize] = 2;
        array[offset + 3 * vertexSize] = 3;
        for (var j = 0; j < 4; ++j)
        {
            var vtxOffset = offset + j * vertexSize;
            array[vtxOffset + 1] = visibleItems[i].boneIndex;
            array[vtxOffset + 2] = visibleItems[i].position[0];
            array[vtxOffset + 3] = visibleItems[i].position[1];
            array[vtxOffset + 4] = visibleItems[i].position[2];
            array[vtxOffset + 5] = visibleItems[i].color[0];
            array[vtxOffset + 6] = visibleItems[i].color[1];
            array[vtxOffset + 7] = visibleItems[i].color[2];
            array[vtxOffset + 8] = visibleItems[i].blinkPhase;
            array[vtxOffset + 9] = visibleItems[i].blinkRate;
            array[vtxOffset + 10] = visibleItems[i].minScale;
            array[vtxOffset + 11] = visibleItems[i].maxScale;
            array[vtxOffset + 12] = visibleItems[i].falloff;
        }
    }
    this._vertexBuffer = device.gl.createBuffer();
    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
    device.gl.bufferData(device.gl.ARRAY_BUFFER, array, device.gl.STATIC_DRAW);
    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);

    var indexes = new Uint16Array(visibleItems.length * 6);
    for (var i = 0; i < visibleItems.length; ++i)
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
 * Sprite set render batch
 * @inherits Tw2RenderBatch
 * @constructor
 */
function EveSpriteSetBatch()
{
    this._super.constructor.call(this);
    this.spriteSet = null;
}

/**
 * Commits the sprite set
 * @param {Tw2Effect} overrideEffect
 */
EveSpriteSetBatch.prototype.Commit = function(overrideEffect)
{
    this.spriteSet.Render(overrideEffect);
};

Inherit(EveSpriteSetBatch, Tw2RenderBatch);

/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 */
EveSpriteSet.prototype.GetBatches = function(mode, accumulator, perObjectData)
{
    if (this.display && mode == device.RM_ADDITIVE)
    {
        var batch = new EveSpriteSetBatch();
        batch.renderMode = device.RM_ADDITIVE;
        batch.spriteSet = this;
        batch.perObjectData = perObjectData;
        accumulator.Commit(batch);
    }
};

/**
 * Renders the sprite set
 * @param {Tw2Effect} overrideEffect
 */
EveSpriteSet.prototype.Render = function(overrideEffect)
{
    var effect = typeof(overrideEffect) == 'undefined' ? this.effect : overrideEffect;
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
        if (!this._decl.SetDeclaration(effect.GetPassInput(pass), 52))
        {
            return;
        }
        device.ApplyShadowState();
        device.gl.drawElements(device.gl.TRIANGLES, this._indexBuffer.count, device.gl.UNSIGNED_SHORT, 0);
    }
};

/**
 * Per frame update
 * @param {number} dt - Delta time
 */
EveSpriteSet.prototype.Update = function(dt)
{
    this._time += dt;
};

/**
 * Clears the sprite set's sprites
 */
EveSpriteSet.prototype.Clear = function()
{
    this.sprites = [];
};

/**
 * Adds a sprite set item to the sprite set
 * @param {vec3} pos
 * @param {number} blinkRate
 * @param {number} blinkPhase
 * @param {number} minScale
 * @param {number} maxScale
 * @param {number} falloff
 * @param {quat4} color
 * @constructor
 */
EveSpriteSet.prototype.Add = function(pos, blinkRate, blinkPhase, minScale, maxScale, falloff, color)
{
    var item = new EveSpriteSetItem();
    item.display = true;
    item.position = vec3.create(pos);
    item.blinkRate = blinkRate;
    item.blinkPhase = blinkPhase;
    item.minScale = minScale;
    item.maxScale = maxScale;
    item.falloff = falloff;
    item.color = quat4.create(color);
    this.sprites[this.sprites.length] = item;
};

/**
 * EveSpriteSetItem
 * @property {string} name
 * @property {vec3} position
 * @property {number} blinkRate
 * @property {number} minScale
 * @property {number} falloff
 * @property {quat4} color
 * @property {number} boneIndex
 * @property {number} groupIndex
 * @constructor
 */
function EveSpriteSetItem()
{
    this.display = true;
    this.name = '';
    this.position = vec3.create();
    this.blinkRate = 0;
    this.blinkPhase = 0;
    this.minScale = 1;
    this.maxScale = 1;
    this.falloff = 0;
    this.color = quat4.create();
    this.boneIndex = 0;
    this.groupIndex = -1;
}
