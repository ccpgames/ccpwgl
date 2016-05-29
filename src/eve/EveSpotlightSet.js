/**
 * Spotlight Item
 * @property {string} name
 * @property {mat4} transform
 * @property {quat4} coneColor
 * @property {quat4} spriteColor
 * @property {quat4} flareColor
 * @property {quat4} spriteScale
 * @property {Boolean} boosterGainInfluence
 * @property {Number} boneIndex
 * @property {Number} groupIndex
 * @constructor
 */
function EveSpotlightSetItem()
{
    this.display = true;
    this.name = '';
    this.transform = mat4.create();
    this.coneColor = quat4.create();
    this.spriteColor = quat4.create();
    this.flareColor = quat4.create();
    this.spriteScale = vec3.create();
    this.boosterGainInfluence = false;
    this.boneIndex = 0;
    this.groupIndex = -1;
}


/**
 * EveSpotlightSet
 * @property {string} name
 * @property {Boolean} display
 * @property {Tw2Effect} coneEffect
 * @property {Tw2Effect} glowEffect
 * @property {Array.<EveSpotlightSetItem) spotlightItems
 * @property {WebGLBuffer} _conVertexBuffer
 * @property {WebGLBuffer} _spriteVertexBuffer
 * @property {WebGLBuffer} _indexBuffer
 * @property {Tw2VertexDeclaration} _decl
 * @constructor
 */
function EveSpotlightSet()
{
    this.name = '';
    this.display = true;
    this.coneEffect = null;
    this.glowEffect = null;
    this.spotlightItems = [];

    this._coneVertexBuffer = null;
    this._spriteVertexBuffer = null;
    this._indexBuffer = null;

    this._decl = new Tw2VertexDeclaration();
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_COLOR, 0, device.gl.FLOAT, 4, 0));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 0, device.gl.FLOAT, 4, 16));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 4, 32));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 2, device.gl.FLOAT, 4, 48));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 3, device.gl.FLOAT, 3, 64));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 4, device.gl.FLOAT, 3, 76));
    this._decl.RebuildHash();
}

/**
 * Initializes the spotlight set
 */
EveSpotlightSet.prototype.Initialize = function()
{
    this.RebuildBuffers();
};

/**
 * Gets spotlight set res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2Res>} [out]
 */
EveSpotlightSet.prototype.GetResources = function(out)
{
    if (out === undefined)
    {
        out = [];
    }

    if (this.coneEffect !== null)
    {
        this.coneEffect.GetResources(out);
    }

    if (this.glowEffect !== null)
    {
        this.glowEffect.GetResources(out);
    }
    return out;
};

/**
 * Rebuilds the spotlight set
 */
EveSpotlightSet.prototype.RebuildBuffers = function()
{
    var visibleItems = [];
    for (var i = 0; i < this.spotlightItems.length; i++)
    {
        if (this.spotlightItems[i].display)
        {
            visibleItems.push(this.spotlightItems[i]);
        }
    }

    var itemCount = visibleItems.length;
    if (itemCount == 0)
    {
        return;
    }
    var vertCount = 4;
    var coneQuadCount = 4;
    var coneVertexCount = itemCount * coneQuadCount * vertCount;

    var vertexSize = 22;
    var array = new Float32Array(coneVertexCount * vertexSize);

    var indexes = [1, 0, 2, 3];

    for (var i = 0; i < itemCount; ++i)
    {
        var item = visibleItems[i];
        for (var q = 0; q < coneQuadCount; ++q)
        {
            for (var v = 0; v < vertCount; ++v)
            {
                var offset = (i * coneQuadCount * vertCount + vertCount * q + v) * vertexSize;
                array[offset] = item.coneColor[0];
                array[offset + 1] = item.coneColor[1];
                array[offset + 2] = item.coneColor[2];
                array[offset + 3] = item.coneColor[3];

                array[offset + 4] = item.transform[0];
                array[offset + 5] = item.transform[4];
                array[offset + 6] = item.transform[8];
                array[offset + 7] = item.transform[12];

                array[offset + 8] = item.transform[1];
                array[offset + 9] = item.transform[5];
                array[offset + 10] = item.transform[9];
                array[offset + 11] = item.transform[13];

                array[offset + 12] = item.transform[2];
                array[offset + 13] = item.transform[6];
                array[offset + 14] = item.transform[10];
                array[offset + 15] = item.transform[14];

                array[offset + 16] = 1;
                array[offset + 17] = 1;
                array[offset + 18] = 1;

                array[offset + 19] = q * vertCount + indexes[v];
                array[offset + 20] = item.boneIndex;
                array[offset + 21] = item.boosterGainInfluence ? 255 : 0;
            }
        }
    }

    this._coneVertexBuffer = device.gl.createBuffer();
    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._coneVertexBuffer);
    device.gl.bufferData(device.gl.ARRAY_BUFFER, array, device.gl.STATIC_DRAW);
    this._coneVertexBuffer.count = itemCount * coneQuadCount * 6;

    var spriteQuadCount = 2;
    var spriteVertexCount = itemCount * spriteQuadCount * vertCount;
    array = new Float32Array(spriteVertexCount * vertexSize);

    var indexes = [1, 0, 2, 3];

    for (var i = 0; i < itemCount; ++i)
    {
        var item = visibleItems[i];
        for (var q = 0; q < spriteQuadCount; ++q)
        {
            for (var v = 0; v < vertCount; ++v)
            {
                var offset = (i * spriteQuadCount * vertCount + vertCount * q + v) * vertexSize;
                if (q % 2 == 0)
                {
                    array[offset] = item.spriteColor[0];
                    array[offset + 1] = item.spriteColor[1];
                    array[offset + 2] = item.spriteColor[2];
                    array[offset + 3] = item.spriteColor[3];

                    array[offset + 16] = item.spriteScale[0];
                    array[offset + 17] = 1;
                    array[offset + 18] = 1;
                }
                else
                {
                    array[offset] = item.flareColor[0];
                    array[offset + 1] = item.flareColor[1];
                    array[offset + 2] = item.flareColor[2];
                    array[offset + 3] = item.flareColor[3];

                    array[offset + 16] = 1;
                    array[offset + 17] = item.spriteScale[1];
                    array[offset + 18] = item.spriteScale[2];
                }

                array[offset + 4] = item.transform[0];
                array[offset + 5] = item.transform[4];
                array[offset + 6] = item.transform[8];
                array[offset + 7] = item.transform[12];

                array[offset + 8] = item.transform[1];
                array[offset + 9] = item.transform[5];
                array[offset + 10] = item.transform[9];
                array[offset + 11] = item.transform[13];

                array[offset + 12] = item.transform[2];
                array[offset + 13] = item.transform[6];
                array[offset + 14] = item.transform[10];
                array[offset + 15] = item.transform[14];

                array[offset + 19] = q * vertCount + indexes[v];
                array[offset + 20] = item.boneIndex;
                array[offset + 21] = item.boosterGainInfluence ? 255 : 0;
            }
        }
    }

    this._spriteVertexBuffer = device.gl.createBuffer();
    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._spriteVertexBuffer);
    device.gl.bufferData(device.gl.ARRAY_BUFFER, array, device.gl.STATIC_DRAW);
    this._spriteVertexBuffer.count = itemCount * spriteQuadCount * 6;

    var indexes = new Uint16Array(itemCount * coneQuadCount * 6);
    for (var i = 0; i < itemCount * coneQuadCount; ++i)
    {
        var offset = i * 6;
        var vtxOffset = i * 4;
        indexes[offset] = vtxOffset;
        indexes[offset + 1] = vtxOffset + 1;
        indexes[offset + 2] = vtxOffset + 2;
        indexes[offset + 3] = vtxOffset + 2;
        indexes[offset + 4] = vtxOffset + 3;
        indexes[offset + 5] = vtxOffset + 0;
    }
    this._indexBuffer = device.gl.createBuffer();
    device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, indexes, device.gl.STATIC_DRAW);
    device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, null);
};

/**
 * Spotlight set render batch
 * @inherits Tw2RenderBatch
 * @constructor
 */
function EveSpotlightSetBatch()
{
    this._super.constructor.call(this);
    this.spotlightSet = null;
}

/**
 * Commits the spotlight set
 * @param {Tw2Effect} overrideEffect
 */
EveSpotlightSetBatch.prototype.Commit = function(overrideEffect)
{
    this.spotlightSet.RenderCones(overrideEffect);
    this.spotlightSet.RenderGlow(overrideEffect);
};

Inherit(EveSpotlightSetBatch, Tw2RenderBatch);

/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 */
EveSpotlightSet.prototype.GetBatches = function(mode, accumulator, perObjectData)
{
    if (this.display && mode == device.RM_ADDITIVE)
    {
        var batch = new EveSpotlightSetBatch();
        batch.renderMode = device.RM_ADDITIVE;
        batch.spotlightSet = this;
        batch.perObjectData = perObjectData;
        accumulator.Commit(batch);
    }
};

/**
 * Renders Spotlight set Cones
 * @param {Tw2Effect} overrideEffect
 */
EveSpotlightSet.prototype.RenderCones = function(overrideEffect)
{
    var effect = (!overrideEffect) ? this.coneEffect : overrideEffect;
    this._Render(effect, this._coneVertexBuffer);
};

/**
 * Renders Spotlight set glows
 * @param {Tw2Effect} overrideEffect
 */
EveSpotlightSet.prototype.RenderGlow = function(overrideEffect)
{
    var effect = (!overrideEffect) ? this.glowEffect : overrideEffect;
    this._Render(effect, this._spriteVertexBuffer);
};

/**
 * Internal render function
 * @param {Tw2Effect} effect
 * @param {WebGLBuffer} buffer
 * @private
 */
EveSpotlightSet.prototype._Render = function(effect, buffer)
{
    if (!effect || !buffer || !this._indexBuffer)
    {
        return;
    }
    var effectRes = effect.GetEffectRes();
    if (!effectRes.IsGood())
    {
        return;
    }

    device.SetStandardStates(device.RM_ADDITIVE);

    device.gl.bindBuffer(device.gl.ARRAY_BUFFER, buffer);
    var stride = 22 * 4;
    device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

    for (var pass = 0; pass < effect.GetPassCount(); ++pass)
    {
        effect.ApplyPass(pass);
        if (!this._decl.SetDeclaration(effect.GetPassInput(pass), stride))
        {
            return;
        }
        device.ApplyShadowState();
        device.gl.drawElements(device.gl.TRIANGLES, buffer.count, device.gl.UNSIGNED_SHORT, 0);
    }
};
