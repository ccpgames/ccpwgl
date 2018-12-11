import {vec3, quat, mat4, util, device, store} from '../../global';
import {Tw2PerObjectData, Tw2ForwardingRenderBatch} from '../../core/';

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

    _id = util.generateID();
    name = '';
    display = true;
    decalEffect = null;
    pickEffect = null;
    parentGeometry = null;
    parentBoneIndex = -1;
    groupIndex = -1;
    pickable = true;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.create();
    decalMatrix = mat4.create();
    invDecalMatrix = mat4.create();
    indexBuffer = [];
    _indexBuffer = null;
    _perObjectData = new Tw2PerObjectData(EveSpaceObjectDecal.perObjectData);


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
            const
                gl = device.gl,
                indexes = new Uint16Array(this.indexBuffer);

            this._indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexes, gl.STATIC_DRAW);
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

    /**
     * Per object data
     * @type {{VSData: *[], PSData: *[]}}
     */
    static perObjectData = {
        VSData: [
            ['worldMatrix', 16],
            ['invWorldMatrix', 16],
            ['decalMatrix', 16],
            ['invDecalMatrix', 16],
            ['parentBoneMatrix', 16, mat4.identity([])]
        ],
        PSData: [
            ['displayData', 4],
            ['shipData', 4 * 3]
        ]
    };

}
