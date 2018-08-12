import {Tw2GeometryBatch} from '../../core';
import {util, device} from '../../global';

/**
 * Constructor for Overlay Effects
 *
 * @property {number|string} _id
 * @property {string} name
 * @property {boolean} display                     - Enables/ disables all batch accumulations
 * @property {{}} visible                          - Batch accumulation options for the overlay effect
 * @property {boolean} visible.opaqueEffects       - Enables/ disables opaque effect batch accumulation
 * @property {boolean} visible.decalEffects        - Enables/ disables decal effect batch accumulation
 * @property {boolean} visible.transparentEffects  - Enables/ disables transparent effect batch accumulation
 * @property {boolean} visible.additiveEffects     - Enables/ disables additive effect batch accumulation
 * @property {boolean} visible.distortionEffects   - Currently not supported
 * @property {boolean} update
 * @property {Tw2CurveSet} curveSet
 * @property {Array.<Tw2Effect>} opaqueEffects
 * @property {Array.<Tw2Effect>} decalEffects
 * @property {Array.<Tw2Effect>} transparentEffects
 * @property {Array.<Tw2Effect>} additiveEffects
 * @property {Array.<Tw2Effect>} distortionEffects - Currently not supported
 * @class
 */
export class EveMeshOverlayEffect
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.display = true;
        this.visible = {};
        this.visible.opaqueEffects = true;
        this.visible.decalEffects = true;
        this.visible.transparentEffects = true;
        this.visible.additiveEffects = true;
        this.visible.distortionEffects = false;
        this.update = true;
        this.curveSet = null;
        this.opaqueEffects = [];
        this.decalEffects = [];
        this.transparentEffects = [];
        this.additiveEffects = [];
        this.distortionEffects = [];
    }

    /**
     * Gets the mesh overlay's resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        util.perArrayChild(this.opaqueEffects, 'GetResources', out);
        util.perArrayChild(this.decalEffects, 'GetResources', out);
        util.perArrayChild(this.transparentEffects, 'GetResources', out);
        util.perArrayChild(this.additiveEffects, 'GetResources', out);
        util.perArrayChild(this.distortionEffects, 'GetResources', out);
        return out;
    }

    /**
     * Per frame update
     * @param {number} dt - delta Time
     */
    Update(dt)
    {
        if (this.update && this.curveSet) this.curveSet.Update(dt);
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {Tw2Mesh} mesh
     */
    GetBatches(mode, accumulator, perObjectData, mesh)
    {
        if (!this.display || !mesh || !mesh.IsGood()) return;

        const effects = this.GetEffects(mode);
        for (let i = 0; i < effects.length; i++)
        {
            const batch = new Tw2GeometryBatch();
            batch.renderMode = mode;
            batch.perObjectData = perObjectData;
            batch.geometryRes = mesh.geometryResource;
            batch.meshIx = mesh.meshIndex;
            batch.start = 0;
            batch.count = mesh.geometryResource.meshes[mesh.meshIndex].areas.length;
            batch.effect = effects[i];
            accumulator.Commit(batch);
        }
    }

    /**
     * Gets effects
     * @param {number} mode
     * @returns {Array.<Tw2Effect>}
     */
    GetEffects(mode)
    {
        if (this.display)
        {
            switch (mode)
            {
                case device.RM_OPAQUE:
                    if (this.visible.opaqueEffects) return this.opaqueEffects;
                    break;

                case device.RM_TRANSPARENT:
                    if (this.visible.transparentEffects) return this.transparentEffects;
                    break;

                case device.RM_ADDITIVE:
                    if (this.visible.additiveEffects) return this.additiveEffects;
                    break;

                case device.RM_DECAL:
                    if (this.visible.decalEffects) return this.decalEffects;
                    break;
            }
        }
        return [];
    }
}