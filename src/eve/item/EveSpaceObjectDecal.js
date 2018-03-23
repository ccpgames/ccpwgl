import {vec3, quat, mat4, util} from '../../math';
import {
    device,
    store,
    Tw2PerObjectData,
    Tw2RawData,
    Tw2ForwardingRenderBatch
} from '../../core/';

/**
 * EveSpaceObjectDecal
 *
 * @property {String|number} _id
 * @property {String} name
 * @property {boolean} display
 * @property {Tw2Effect} decalEffect
 * @property {Tw2Effect} pickEffect
 * @property {Tw2GeometryRes} parentGeometry
 * @property {number} parentBoneIndex
 * @property {number} groupIndex
 * @property {boolean} pickable
 * @property {vec3} position
 * @property {quat} rotation
 * @property {vec3} scaling
 * @property {mat4} decalMatrix
 * @property {mat4} invDecalMatrix
 * @property {Array} indexBuffer
 * @property {*} _indexBuffer
 * @property {Tw2PerObjectData} _perObjectData
 * @class
 */
export class EveSpaceObjectDecal
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.display = true;
        this.decalEffect = null;
        this.pickEffect = null;
        this.parentGeometry = null;
        this.parentBoneIndex = -1;
        this.groupIndex = -1;
        this.pickable = true;
        this.position = vec3.create();
        this.rotation = quat.create();
        this.scaling = vec3.create();
        this.decalMatrix = mat4.create();
        this.invDecalMatrix = mat4.create();
        this.indexBuffer = [];
        this._indexBuffer = null;

        this._perObjectData = new Tw2PerObjectData();
        this._perObjectData.perObjectVSData = new Tw2RawData();
        this._perObjectData.perObjectVSData.Declare('worldMatrix', 16);
        this._perObjectData.perObjectVSData.Declare('invWorldMatrix', 16);
        this._perObjectData.perObjectVSData.Declare('decalMatrix', 16);
        this._perObjectData.perObjectVSData.Declare('invDecalMatrix', 16);
        this._perObjectData.perObjectVSData.Declare('parentBoneMatrix', 16);
        this._perObjectData.perObjectVSData.Create();

        this._perObjectData.perObjectPSData = new Tw2RawData();
        this._perObjectData.perObjectPSData.Declare('displayData', 4);
        this._perObjectData.perObjectPSData.Declare('shipData', 4 * 3);
        this._perObjectData.perObjectPSData.Create();

        mat4.identity(this._perObjectData.perObjectVSData.Get('parentBoneMatrix'));
    }

    /**
     * Initializes the decal
     */
    Initialize()
    {
        this.SetIndexBuffer(this.indexBuffer);
    }

    /**
     * Fire on value changes
     */
    OnValueChanged()
    {
        if (!this._indexBuffer && this.indexBuffer)
        {
            const indexes = new Uint16Array(this.indexBuffer);
            this._indexBuffer = device.gl.createBuffer();
            device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
            device.gl.bufferData(device.gl.ELEMENT_ARRAY_BUFFER, indexes, device.gl.STATIC_DRAW);
        }

        mat4.fromRotationTranslationScale(this.decalMatrix, this.rotation, this.position, this.scaling);
        mat4.invert(this.invDecalMatrix, this.decalMatrix);
    }

    /**
     * Sets the parent geometry
     * @param {Tw2GeometryRes} geometryRes
     */
    SetParentGeometry(geometryRes)
    {
        this.parentGeometry = geometryRes;
    }

    /**
     * Sets the decal's index buffer
     * @param {number[]} indices
     */
    SetIndexBuffer(indices)
    {
        this.indexBuffer = indices;
        this.Unload();
        this.OnValueChanged();
    }

    /**
     * Gets decal resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.parentGeometry && !out.includes(this.parentGeometry))
        {
            out.push(this.parentGeometry);
        }

        if (this.decalEffect) this.decalEffect.GetResources(out);
        if (this.pickEffect) this.pickEffect.GetResources(out);
        return out;
    }

    /**
     * Unloads the decal's buffers
     */
    Unload()
    {
        if (this._indexBuffer)
        {
            device.gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }
    }

    /**
     * Gets batches for rendering
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {number} [counter=0]
     */
    GetBatches(mode, accumulator, perObjectData, counter)
    {
        let effect;
        switch (mode)
        {
            case device.RM_DECAL:
                effect = this.decalEffect;
                break;

            case device.RM_PICKABLE:
                effect = this.pickable ? this.pickEffect : null;
                break;
        }

        if
        (
            this.display && effect && effect.IsGood() && this.indexBuffer.length && this.parentGeometry && this.parentGeometry.IsGood()
        )
        {
            const batch = new Tw2ForwardingRenderBatch();
            this._perObjectData.perObjectVSData.Set('worldMatrix', perObjectData.perObjectVSData.Get('WorldMat'));
            if (this.parentBoneIndex >= 0)
            {
                const
                    bones = perObjectData.perObjectVSData.Get('JointMat'),
                    offset = this.parentBoneIndex * 12;

                if (bones[offset] || bones[offset + 4] || bones[offset + 8])
                {
                    const bone = this._perObjectData.perObjectVSData.Get('parentBoneMatrix');
                    bone[0] = bones[offset];
                    bone[1] = bones[offset + 4];
                    bone[2] = bones[offset + 8];
                    bone[3] = 0;
                    bone[4] = bones[offset + 1];
                    bone[5] = bones[offset + 5];
                    bone[6] = bones[offset + 9];
                    bone[7] = 0;
                    bone[8] = bones[offset + 2];
                    bone[9] = bones[offset + 6];
                    bone[10] = bones[offset + 10];
                    bone[11] = 0;
                    bone[12] = bones[offset + 3];
                    bone[13] = bones[offset + 7];
                    bone[14] = bones[offset + 11];
                    bone[15] = 1;
                    mat4.transpose(bone, bone);
                }
            }

            mat4.invert(this._perObjectData.perObjectVSData.Get('invWorldMatrix'), this._perObjectData.perObjectVSData.Get('worldMatrix'));
            mat4.transpose(this._perObjectData.perObjectVSData.Get('decalMatrix'), this.decalMatrix);
            mat4.transpose(this._perObjectData.perObjectVSData.Get('invDecalMatrix'), this.invDecalMatrix);

            this._perObjectData.perObjectPSData.Get('displayData')[0] = counter || 0;
            this._perObjectData.perObjectPSData.Set('shipData', perObjectData.perObjectPSData.data);

            batch.perObjectData = this._perObjectData;
            batch.geometryProvider = this;
            batch.renderMode = mode;
            batch.effect = effect;
            accumulator.Commit(batch);
        }
    }

    /**
     * Renders the decal
     * @param {Tw2ForwardingRenderBatch} batch
     * @param {string} technique - technique name
     */
    Render(batch, technique)
    {
        const
            bkIB = this.parentGeometry.meshes[0].indexes,
            bkStart = this.parentGeometry.meshes[0].areas[0].start,
            bkCount = this.parentGeometry.meshes[0].areas[0].count,
            bkIndexType = this.parentGeometry.meshes[0].indexType;

        store.SetVariableValue('u_DecalMatrix', this.decalMatrix);
        store.SetVariableValue('u_InvDecalMatrix', this.invDecalMatrix);

        this.parentGeometry.meshes[0].indexes = this._indexBuffer;
        this.parentGeometry.meshes[0].areas[0].start = 0;
        this.parentGeometry.meshes[0].areas[0].count = this.indexBuffer.length;
        this.parentGeometry.meshes[0].indexType = device.gl.UNSIGNED_SHORT;

        this.parentGeometry.RenderAreas(0, 0, 1, batch.effect, technique);
        this.parentGeometry.meshes[0].indexes = bkIB;
        this.parentGeometry.meshes[0].areas[0].start = bkStart;
        this.parentGeometry.meshes[0].areas[0].count = bkCount;
        this.parentGeometry.meshes[0].indexType = bkIndexType;
    }
}
