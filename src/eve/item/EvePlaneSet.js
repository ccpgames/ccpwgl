import {vec3, vec4, quat, mat4, util} from '../../math';
import {device, Tw2VertexDeclaration, Tw2VertexElement, Tw2RenderBatch} from '../../core';
import {EveObjectSet, EveObjectSetItem} from './EveObjectSet';

/**
 * Plane set render batch
 *
 * @property {EvePlaneSet} planeSet
 * @class
 */
export class EvePlaneSetBatch extends Tw2RenderBatch
{
    constructor()
    {
        super();
        this.planeSet = null;
    }

    /**
     * Commits the plan set
     * @param {Tw2Effect} [effect] An optional override effect
     */
    Commit(effect)
    {
        this.planeSet.Render(effect);
    }
}


/**
 * EvePlaneSetItem
 *
 * @property {number} boneIndex
 * @property {number} groupIndex
 * @property {number} maskAtlasID
 * @property {vec3} position
 * @property {vec3} scaling
 * @property {quat} rotation
 * @property {vec4} color
 * @property {vec4} layer1Transform
 * @property {vec4} layer2Transform
 * @property {vec4} layer1Scroll
 * @property {vec4} layer2Scroll
 * @class
 */
export class EvePlaneSetItem extends EveObjectSetItem
{
    constructor()
    {
        super();
        this.boneIndex = 0;
        this.groupIndex = -1;
        this.maskAtlasID = 0;
        this.position = vec3.create();
        this.scaling = vec3.fromValues(1, 1, 1);
        this.rotation = quat.create();
        this.transform = mat4.create();
        this.color = vec4.fromValues(1, 1, 1, 1);
        this.layer1Transform = vec4.fromValues(1, 1, 0, 0);
        this.layer2Transform = vec4.fromValues(1, 1, 0, 0);
        this.layer1Scroll = vec4.create();
        this.layer2Scroll = vec4.create();
    }

    /**
     * Creates a plane set item from an object
     * @param {*} opt
     * @returns {EvePlaneSetItem}
     */
    static create(opt = {})
    {
        const item = new this();
        util.assignIfExists(item, opt, [
            'name', 'display', 'boneIndex', 'groupIndex', 'maskAtlasID',
            'position', 'scaling', 'rotation', 'transform', 'color',
            'layer1Transform', 'layer2Transform', 'layer1Scroll', 'layer2Scroll'
        ]);
        return item;
    }
}

/**
 * EvePlaneSet
 *
 * @property {String} name
 * @property {Array.<EvePlaneSetItem>} planes
 * @property {Tw2Effect} effect
 * @property {boolean} display
 * @property {boolean} hideOnLowQuality
 * @property {number} _time
 * @property {WebGLBuffer} _vertexBuffer
 * @property {WebGLBuffer} _indexBuffer
 * @property {Tw2VertexDeclaration} _decl
 * @class
 */
export class EvePlaneSet extends EveObjectSet
{
    constructor()
    {
        super();
        this.effect = null;
        this.hideOnLowQuality = false;
        this._time = 0;
        this._vertexBuffer = null;
        this._indexBuffer = null;

        this._decl = new Tw2VertexDeclaration();
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 0, device.gl.FLOAT, 4, 0));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 1, device.gl.FLOAT, 4, 16));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 2, device.gl.FLOAT, 4, 32));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.COLOR, 0, device.gl.FLOAT, 4, 48));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 3, device.gl.FLOAT, 4, 64));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 4, device.gl.FLOAT, 4, 80));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 5, device.gl.FLOAT, 4, 96));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 6, device.gl.FLOAT, 4, 112));
        this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 7, device.gl.FLOAT, 3, 128));
        this._decl.RebuildHash();
    }

    /**
     * Alias for this.items
     * @returns {Array}
     */
    get planes()
    {
        return this.items;
    }

    /**
     * Alias for this.items
     * @param {Array} arr
     */
    set planes(arr)
    {
        this.items = arr;
    }

    /**
     * Gets plane set res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array} {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.effect)
        {
            this.effect.GetResources(out);
        }
        return out;
    }

    /**
     * Per frame update
     * @param {number} dt - Delta Time
     */
    Update(dt)
    {
        this._time += dt;

        if (this._rebuildPending)
        {
            this.Rebuild();
        }
    }

    /**
     * Unloads the set's buffers
     */
    Unload()
    {
        if (this._vertexBuffer)
        {
            device.gl.deleteBuffer(this._vertexBuffer);
            this._vertexBuffer = null;
        }

        if (this._indexBuffer)
        {
            device.gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }
    }

    /**
     * Rebuilds the plane set's buffers
     */
    Rebuild()
    {
        this.Unload();
        EvePlaneSet.RebuildItems(this);
        this._rebuildPending = false;
        const itemCount = this._visibleItems.length;
        if (!itemCount) return;

        const
            vertexSize = 35,
            mat4_0 = EvePlaneSet.global.mat4_0;

        const array = new Float32Array(itemCount * 4 * vertexSize);
        for (let i = 0; i < itemCount; ++i)
        {
            const
                item = this._visibleItems[i],
                offset = i * 4 * vertexSize;

            array[offset + vertexSize - 3] = 0;
            array[offset + vertexSize + vertexSize - 3] = 1;
            array[offset + 2 * vertexSize + vertexSize - 3] = 2;
            array[offset + 3 * vertexSize + vertexSize - 3] = 3;

            const itemTransform = mat4.fromRotationTranslationScale(mat4_0, item.rotation, item.position, item.scaling);

            for (let j = 0; j < 4; ++j)
            {
                const vtxOffset = offset + j * vertexSize;
                array[vtxOffset] = itemTransform[0];
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

                array[vtxOffset + 12] = item.color[0];
                array[vtxOffset + 13] = item.color[1];
                array[vtxOffset + 14] = item.color[2];
                array[vtxOffset + 15] = item.color[3];

                array[vtxOffset + 16] = item.layer1Transform[0];
                array[vtxOffset + 17] = item.layer1Transform[1];
                array[vtxOffset + 18] = item.layer1Transform[2];
                array[vtxOffset + 19] = item.layer1Transform[3];

                array[vtxOffset + 20] = item.layer2Transform[0];
                array[vtxOffset + 21] = item.layer2Transform[1];
                array[vtxOffset + 22] = item.layer2Transform[2];
                array[vtxOffset + 23] = item.layer2Transform[3];

                array[vtxOffset + 24] = item.layer1Scroll[0];
                array[vtxOffset + 25] = item.layer1Scroll[1];
                array[vtxOffset + 26] = item.layer1Scroll[2];
                array[vtxOffset + 27] = item.layer1Scroll[3];

                array[vtxOffset + 28] = item.layer2Scroll[0];
                array[vtxOffset + 29] = item.layer2Scroll[1];
                array[vtxOffset + 30] = item.layer2Scroll[2];
                array[vtxOffset + 31] = item.layer2Scroll[3];

                array[vtxOffset + 33] = item.boneIndex;
                array[vtxOffset + 34] = item.maskAtlasID;
            }
        }

        this._vertexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, array, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);

        const indexes = new Uint16Array(itemCount * 6);
        for (let i = 0; i < itemCount; ++i)
        {
            const
                offset = i * 6,
                vtxOffset = i * 4;

            indexes[offset] = vtxOffset;
            indexes[offset + 1] = vtxOffset + 2;
            indexes[offset + 2] = vtxOffset + 1;
            indexes[offset + 3] = vtxOffset;
            indexes[offset + 4] = vtxOffset + 3;
            indexes[offset + 5] = vtxOffset + 2;
        }

        this._indexBuffer = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, indexes, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, null);
        this._indexBuffer.count = itemCount * 6;
    }

    /**
     * Gets the plane set's render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (this.display && mode === device.RM_ADDITIVE && this._indexBuffer && this._visibleItems.length)
        {
            const batch = new EvePlaneSetBatch();
            batch.renderMode = device.RM_ADDITIVE;
            batch.planeSet = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
        }
    }

    /**
     * Renders the plane set
     * @param {Tw2Effect} [effect=this.effect] optional effect override
     */
    Render(effect = this.effect)
    {
        if (!effect || !effect.effectRes && !effect.effectRes.IsGood()) return false;

        device.SetStandardStates(device.RM_ADDITIVE);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        for (let pass = 0; pass < effect.GetPassCount(); ++pass)
        {
            effect.ApplyPass(pass);
            if (!this._decl.SetDeclaration(effect.GetPassInput(pass), 140)) return false;
            device.ApplyShadowState();
            device.gl.drawElements(device.gl.TRIANGLES, this._indexBuffer.count, device.gl.UNSIGNED_SHORT, 0);
        }
        return true;
    }
}

/**
 * The plane set's item constructor
 * @type {EvePlaneSetItem}
 */
EvePlaneSet.Item = EvePlaneSetItem;
