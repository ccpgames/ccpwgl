import {vec3, vec4, mat4, util, device} from '../../global';
import {Tw2VertexDeclaration, Tw2RenderBatch} from '../../core';
import {EveObjectSet, EveObjectSetItem} from './EveObjectSet';

/**
 * EveSpotlightSetBatch
 *
 * @property {EveSpotlightSet} spotlightSet
 * @class
 */
export class EveSpotlightSetBatch extends Tw2RenderBatch
{

    spotlightSet = null;

    /**
     * Commits the spotlight set for rendering
     * @param {string} technique - technique name
     */
    Commit(technique)
    {
        this.spotlightSet.RenderCones(technique);
        this.spotlightSet.RenderGlow(technique);
    }

}


/**
 * Spotlight Item
 *
 * @property {mat4} transform               - The spotlight's transform
 * @property {vec4} coneColor               - Colour of the spotlight's cone
 * @property {vec4} spriteColor             - Colour of the spotlight's sprite texture
 * @property {vec4} flareColor              - Colour of the spotlight's flare
 * @property {vec4} spriteScale             - The size of the spotlight
 * @property {number} boosterGainInfluence  - If true, the spotlight can change size on booster gain
 * @property {number} boneIndex             - The spotlight's bone index
 * @property {number} groupIndex            - The sof faction group that the spotlight belongs to
 * @property {number} coneIntensity         - Scales the spotlight's cone colour, set by an object's sof Faction
 * @property {number} spriteIntensity       - Scales the spotlight's sprite colour, set by an object's sof Faction
 * @property {number} flareIntensity        - Scales the spotlight's flare colour, set by an object's sof Faction
 * @class
 */
export class EveSpotlightSetItem extends EveObjectSetItem
{

    transform = mat4.create();
    coneColor = vec4.create();
    spriteColor = vec4.create();
    flareColor = vec4.create();
    spriteScale = vec3.fromValues(1, 1, 1);
    boosterGainInfluence = 0;
    boneIndex = 0;
    groupIndex = -1;
    coneIntensity = 0;
    spriteIntensity = 0;
    flareIntensity = 0;


    /**
     * Creates a spotlight set item from an object
     * @param {*} [opt={}
     * @returns {EveSpotlightSetItem}
     */
    static create(opt = {})
    {
        const item = new this();
        util.assignIfExists(item, opt, [
            'name', 'display', 'boosterGainInfluence', 'boneIndex', 'groupIndex',
            'coneIntensity', 'spriteIntensity', 'flareIntensity', 'transform',
            'coneColor', 'spriteColor', 'flareColor', 'spriteScale'
        ]);
        return item;
    }

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
 * @class
 */
export class EveSpotlightSet extends EveObjectSet
{

    coneEffect = null;
    glowEffect = null;
    _coneVertexBuffer = null;
    _spriteVertexBuffer = null;
    _indexBuffer = null;
    _decl = new Tw2VertexDeclaration(EveSpotlightSet.vertexDeclarations);


    /**
     * Alias for this.items
     * @returns {Array}
     */
    get spotlightItems()
    {
        return this.items;
    }

    /**
     * Alias for this.items
     * @param {Array} arr
     */
    set spotlightItems(arr)
    {
        this.items = arr;
    }

    /**
     * Gets the spotlight set's resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.coneEffect)
        {
            this.coneEffect.GetResources(out);
        }

        if (this.glowEffect)
        {
            this.glowEffect.GetResources(out);
        }

        return out;
    }

    /**
     * Unloads the spotlight set's buffers
     */
    Unload()
    {
        if (this._coneVertexBuffer)
        {
            device.gl.deleteBuffer(this._coneVertexBuffer);
            this._coneVertexBuffer = null;
        }

        if (this._spriteVertexBuffer)
        {
            device.gl.deleteBuffer(this._spriteVertexBuffer);
            this._spriteVertexBuffer = null;
        }

        if (this._indexBuffer)
        {
            device.gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }
    }

    /**
     * Rebuilds the spotlight set's buffers
     */
    Rebuild()
    {
        this.Unload();
        EveSpotlightSet.RebuildItems(this);
        this._rebuildPending = false;
        const itemCount = this._visibleItems.length;
        if (!itemCount) return;

        const
            d = device,
            vertCount = 4,
            coneQuadCount = 4,
            coneVertexCount = itemCount * coneQuadCount * vertCount,
            vertexSize = 22,
            coneIndices = [1, 0, 2, 3],
            coneArray = new Float32Array(coneVertexCount * vertexSize);

        for (let i = 0; i < itemCount; ++i)
        {
            const item = this._visibleItems[i];
            for (let q = 0; q < coneQuadCount; ++q)
            {
                for (let v = 0; v < vertCount; ++v)
                {
                    const offset = (i * coneQuadCount * vertCount + vertCount * q + v) * vertexSize;
                    coneArray[offset] = item.coneColor[0] * item.coneIntensity;
                    coneArray[offset + 1] = item.coneColor[1] * item.coneIntensity;
                    coneArray[offset + 2] = item.coneColor[2] * item.coneIntensity;
                    coneArray[offset + 3] = item.coneColor[3];

                    coneArray[offset + 4] = item.transform[0];
                    coneArray[offset + 5] = item.transform[4];
                    coneArray[offset + 6] = item.transform[8];
                    coneArray[offset + 7] = item.transform[12];

                    coneArray[offset + 8] = item.transform[1];
                    coneArray[offset + 9] = item.transform[5];
                    coneArray[offset + 10] = item.transform[9];
                    coneArray[offset + 11] = item.transform[13];

                    coneArray[offset + 12] = item.transform[2];
                    coneArray[offset + 13] = item.transform[6];
                    coneArray[offset + 14] = item.transform[10];
                    coneArray[offset + 15] = item.transform[14];

                    coneArray[offset + 16] = 1;
                    coneArray[offset + 17] = 1;
                    coneArray[offset + 18] = 1;

                    coneArray[offset + 19] = q * vertCount + coneIndices[v];
                    coneArray[offset + 20] = item.boneIndex;
                    coneArray[offset + 21] = item.boosterGainInfluence ? 255 : 0;
                }
            }
        }

        this._coneVertexBuffer = d.gl.createBuffer();
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._coneVertexBuffer);
        d.gl.bufferData(d.gl.ARRAY_BUFFER, coneArray, d.gl.STATIC_DRAW);
        this._coneVertexBuffer.count = itemCount * coneQuadCount * 6;

        const
            spriteQuadCount = 2,
            spriteVertexCount = itemCount * spriteQuadCount * vertCount,
            spriteArray = new Float32Array(spriteVertexCount * vertexSize),
            spriteIndexes = [1, 0, 2, 3];

        for (let i = 0; i < itemCount; ++i)
        {
            const item = this._visibleItems[i];
            for (let q = 0; q < spriteQuadCount; ++q)
            {
                for (let v = 0; v < vertCount; ++v)
                {
                    const offset = (i * spriteQuadCount * vertCount + vertCount * q + v) * vertexSize;
                    if (q % 2 === 0)
                    {
                        spriteArray[offset] = item.spriteColor[0] * item.spriteIntensity;
                        spriteArray[offset + 1] = item.spriteColor[1] * item.spriteIntensity;
                        spriteArray[offset + 2] = item.spriteColor[2] * item.spriteIntensity;
                        spriteArray[offset + 3] = item.spriteColor[3];

                        spriteArray[offset + 16] = item.spriteScale[0];
                        spriteArray[offset + 17] = 1;
                        spriteArray[offset + 18] = 1;
                    }
                    else
                    {
                        spriteArray[offset] = item.flareColor[0] * item.flareIntensity;
                        spriteArray[offset + 1] = item.flareColor[1] * item.flareIntensity;
                        spriteArray[offset + 2] = item.flareColor[2] * item.flareIntensity;
                        spriteArray[offset + 3] = item.flareColor[3];

                        spriteArray[offset + 16] = 1;
                        spriteArray[offset + 17] = item.spriteScale[1];
                        spriteArray[offset + 18] = item.spriteScale[2];
                    }

                    spriteArray[offset + 4] = item.transform[0];
                    spriteArray[offset + 5] = item.transform[4];
                    spriteArray[offset + 6] = item.transform[8];
                    spriteArray[offset + 7] = item.transform[12];

                    spriteArray[offset + 8] = item.transform[1];
                    spriteArray[offset + 9] = item.transform[5];
                    spriteArray[offset + 10] = item.transform[9];
                    spriteArray[offset + 11] = item.transform[13];

                    spriteArray[offset + 12] = item.transform[2];
                    spriteArray[offset + 13] = item.transform[6];
                    spriteArray[offset + 14] = item.transform[10];
                    spriteArray[offset + 15] = item.transform[14];

                    spriteArray[offset + 19] = q * vertCount + spriteIndexes[v];
                    spriteArray[offset + 20] = item.boneIndex;
                    spriteArray[offset + 21] = item.boosterGainInfluence ? 255 : 0;
                }
            }
        }

        this._spriteVertexBuffer = d.gl.createBuffer();
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._spriteVertexBuffer);
        d.gl.bufferData(d.gl.ARRAY_BUFFER, spriteArray, d.gl.STATIC_DRAW);
        this._spriteVertexBuffer.count = itemCount * spriteQuadCount * 6;

        const indexes = new Uint16Array(itemCount * coneQuadCount * 6);
        for (let i = 0; i < itemCount * coneQuadCount; ++i)
        {
            const
                offset = i * 6,
                vtxOffset = i * 4;

            indexes[offset] = vtxOffset;
            indexes[offset + 1] = vtxOffset + 1;
            indexes[offset + 2] = vtxOffset + 2;
            indexes[offset + 3] = vtxOffset + 2;
            indexes[offset + 4] = vtxOffset + 3;
            indexes[offset + 5] = vtxOffset;
        }

        this._indexBuffer = d.gl.createBuffer();
        d.gl.bindBuffer(d.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        d.gl.bufferData(d.gl.ELEMENT_ARRAY_BUFFER, indexes, d.gl.STATIC_DRAW);
        d.gl.bindBuffer(d.gl.ELEMENT_ARRAY_BUFFER, null);
        this._indexBuffer.count = itemCount;
    }

    /**
     * Gets the spotlight set's render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (this.display && mode === device.RM_ADDITIVE && this._indexBuffer && this._indexBuffer.count)
        {
            const batch = new EveSpotlightSetBatch();
            batch.renderMode = device.RM_ADDITIVE;
            batch.spotlightSet = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
        }
    }

    /**
     * Renders the spotlight set's cone effect
     * @param {string} technique - technique name
     * @returns {boolean}
     */
    RenderCones(technique)
    {
        return EveSpotlightSet.Render(this, this.coneEffect, technique, this._coneVertexBuffer);
    }

    /**
     * Renders the spotlight set's glow effect
     * @param {string} technique - technique name
     * @returns {boolean}
     */
    RenderGlow(technique)
    {
        return EveSpotlightSet.Render(this, this.glowEffect, technique, this._spriteVertexBuffer);
    }

    /**
     * Internal render function
     * @param {EveSpotlightSet} spotlightSet
     * @param {Tw2Effect} effect   - The Tw2Effect to render
     * @param {string} technique - technique name
     * @param {WebGLBuffer} buffer - A webgl buffer (ie. cone or glow buffer)
     * @returns {boolean}
     * @private
     */
    static Render(spotlightSet, effect, technique, buffer)
    {
        if (!effect || !effect.IsGood() || !buffer) return false;

        const stride = 22 * 4;
        device.SetStandardStates(device.RM_ADDITIVE);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, buffer);
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, spotlightSet._indexBuffer);

        for (let pass = 0; pass < effect.GetPassCount(technique); ++pass)
        {
            effect.ApplyPass(technique, pass);
            if (!spotlightSet._decl.SetDeclaration(effect.GetPassInput(technique, pass), stride)) return false;
            device.ApplyShadowState();
            device.gl.drawElements(device.gl.TRIANGLES, buffer['count'], device.gl.UNSIGNED_SHORT, 0);
        }
        return true;
    }

    /**
     * Spotlight set item constructor
     * @type {EveSpotlightSetItem}
     */
    static Item = EveSpotlightSetItem;

    /**
     * Vertex declarations
     * @type {*[]}
     */
    static vertexDeclarations = [
        ['COLOR', 0, 4],
        ['TEXCOORD', 0, 4],
        ['TEXCOORD', 1, 4],
        ['TEXCOORD', 2, 4],
        ['TEXCOORD', 3, 3],
        ['TEXCOORD', 4, 3]
    ];

}




