import {vec3, vec4, mat4} from '../../math';
import {device} from '../../core';
import {Tw2VertexElement} from '../../core';
import {Tw2VertexDeclaration} from '../../core';


/**
 * Spotlight Item
 * - If a spotlight's properties are changed, it's parent's RebuildBuffers method must be called to apply these changes
 *
 * @property {string} name                  - The spotlight's name
 * @property {mat4} transform               - The spotlight's transform
 * @property {vec4} coneColor              - Colour of the spotlight's cone
 * @property {vec4} spriteColor            - Colour of the spotlight's sprite texture
 * @property {vec4} flareColor             - Colour of the spotlight's flare
 * @property {vec4} spriteScale            - The size of the spotlight
 * @property {boolean} boosterGainInfluence - If true, the spotlight can change size on booster gain
 * @property {number} boneIndex             - The spotlight's bone index
 * @property {number} groupIndex            - The sof faction group that the spotlight belongs to
 * @property {number} coneIntensity         - Scales the spotlight's cone colour, set by an object's sof Faction
 * @property {number} spriteIntensity       - Scales the spotlight's sprite colour, set by an object's sof Faction
 * @property {number} flareIntensity        - Scales the spotlight's flare colour, set by an object's sof Faction
 * @constructor
 */
export function EveSpotlightSetItem()
{
    this.display = true;
    this.name = '';
    this.transform = mat4.create();
    this.coneColor = vec4.create();
    this.spriteColor = vec4.create();
    this.flareColor = vec4.create();
    this.spriteScale = vec3.create();
    this.boosterGainInfluence = false;
    this.boneIndex = 0;
    this.groupIndex = -1;
    this.coneIntensity = 1;
    this.spriteIntensity = 1;
    this.flareIntensity = 1;
}


/**
 * EveSpotlightSet
 *
 * @property {string} name                               - The spotlight set's name
 * @property {boolean} display                           - controls the visibility of the spotlight set, and all it's children
 * @property {Tw2Effect} coneEffect                      - The spotlight set's cone effect
 * @property {Tw2Effect} glowEffect                      - The spotlight set's glow effect
 * @property {Array.<EveSpotlightSetItem) spotlightItems - The spotlight set's children
 * @property {WebGLBuffer} _coneVertexBuffer             - Webgl buffer for the spotlight set's cone vertices
 * @property {WebGLBuffer} _spriteVertexBuffer           - Webgl buffer for the spotlight set's sprite/glow vertices
 * @property {WebGLBuffer} _indexBuffer                  - Webgl buffer for the spotlight set
 * @property {Tw2VertexDeclaration} _decl                - The spotlight set's vertex declarations
 * @constructor
 */
export function EveSpotlightSet()
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
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.COLOR, 0, device.gl.FLOAT, 4, 0));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 0, device.gl.FLOAT, 4, 16));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 1, device.gl.FLOAT, 4, 32));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 2, device.gl.FLOAT, 4, 48));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 3, device.gl.FLOAT, 3, 64));
    this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 4, device.gl.FLOAT, 3, 76));
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
 * Gets the spotlight set's resources
 *
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
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
 * Rebuilds the spotlight set's buffers
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
    if (itemCount === 0)
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
                array[offset + 0] = item.coneColor[0] * item.coneIntensity;
                array[offset + 1] = item.coneColor[1] * item.coneIntensity;
                array[offset + 2] = item.coneColor[2] * item.coneIntensity;
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
                if (q % 2 === 0)
                {
                    array[offset + 0] = item.spriteColor[0] * item.spriteIntensity;
                    array[offset + 1] = item.spriteColor[1] * item.spriteIntensity;
                    array[offset + 2] = item.spriteColor[2] * item.spriteIntensity;
                    array[offset + 3] = item.spriteColor[3];

                    array[offset + 16] = item.spriteScale[0];
                    array[offset + 17] = 1;
                    array[offset + 18] = 1;
                }
                else
                {
                    array[offset + 0] = item.flareColor[0] * item.flareIntensity;
                    array[offset + 1] = item.flareColor[1] * item.flareIntensity;
                    array[offset + 2] = item.flareColor[2] * item.flareIntensity;
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
 * EveSpotlightSetBatch
 *
 * @inherits Tw2RenderBatch
 * @constructor
 */
export function EveSpotlightSetBatch()
{
    this.renderMode = device.RM_ANY;
    this.perObjectData = null;
    this.spotlightSet = null;
}

/**
 * Commits the spotlight set for rendering
 *
 * @param {Tw2Effect} overrideEffect
 */
EveSpotlightSetBatch.prototype.Commit = function(overrideEffect)
{
    this.spotlightSet.RenderCones(overrideEffect);
    this.spotlightSet.RenderGlow(overrideEffect);
};


/**
 * Gets the spotlight set's render batches
 *
 * @param {number} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 */
EveSpotlightSet.prototype.GetBatches = function(mode, accumulator, perObjectData)
{
    if (this.display && mode === device.RM_ADDITIVE)
    {
        var batch = new EveSpotlightSetBatch();
        batch.renderMode = device.RM_ADDITIVE;
        batch.spotlightSet = this;
        batch.perObjectData = perObjectData;
        accumulator.Commit(batch);
    }
};

/**
 * Renders the spotlight set's cone effect
 *
 * @param {Tw2Effect} [overrideEffect] - An optional Tw2Effect which can be passed to override the current cone effect
 */
EveSpotlightSet.prototype.RenderCones = function(overrideEffect)
{
    var effect = (!overrideEffect) ? this.coneEffect : overrideEffect;
    this._Render(effect, this._coneVertexBuffer);
};

/**
 * Renders the spotlight set's glow effect
 *
 * @param {Tw2Effect} overrideEffect - An optional Tw2Effect which can be passed to override the current glow effect
 */
EveSpotlightSet.prototype.RenderGlow = function(overrideEffect)
{
    var effect = (!overrideEffect) ? this.glowEffect : overrideEffect;
    this._Render(effect, this._spriteVertexBuffer);
};

/**
 * Internal render function
 *
 * @param {Tw2Effect} effect   - The Tw2Effect to render
 * @param {WebGLBuffer} buffer - A webgl buffer (ie. cone or glow buffer)
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
