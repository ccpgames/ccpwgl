import {util, resMan, device} from '../../global';

/**
 * Tw2Mesh
 *
 * @property {string} name
 * @property {boolean} display                      - Enables/ disables all mesh batch accumulations
 * @parameter {{}} visible                          - Batch accumulation options for the mesh's elements
 * @property {boolean} visible.opaqueAreas          - Enables/ disables opaque area batch accumulation
 * @property {boolean} visible.transparentAreas     - Enables/ disables transparent area batch accumulation
 * @property {boolean} visible.additiveAreas        - Enables/ disables additive area batch accumulation
 * @property {boolean} visible.pickableAreas        - Enables/ disables pickable area batch accumulation
 * @property {boolean} visible.decalAreas           - Enables/ disables decal area batch accumulation
 * @property {boolean} visible.depthAreas           - Not supported
 * @property {Array.<Tw2MeshArea>} opaqueAreas
 * @property {Array.<Tw2MeshArea>} transparentAreas
 * @property {Array.<Tw2MeshArea>} additiveAreas
 * @property {Array.<Tw2MeshArea>} pickableAreas
 * @property {Array.<Tw2MeshArea>} decalAreas
 * @property {Array.<Tw2MeshArea>} depthAreas       - Not supported
 * @property {number} meshIndex
 * @property {string} geometryResPath
 * @property {string} lowDetailGeometryResPath
 * @property {Tw2GeometryRes} geometryResource
 * @class
 */
export class Tw2Mesh
{

    _id = util.generateID();
    name = '';
    display = true;
    visible = {
        opaqueAreas: true,
        transparentAreas: true,
        additiveAreas: true,
        pickableAreas: true,
        decalAreas: true,
        depthAreas: true
    };
    opaqueAreas = [];
    transparentAreas = [];
    additiveAreas = [];
    pickableAreas = [];
    decalAreas = [];
    depthAreas = [];
    meshIndex = 0;
    geometryResPath = '';
    lowDetailGeometryResPath = '';
    geometryResource = null;


    /**
     * Initializes the Tw2Mesh
     */
    Initialize()
    {
        if (this.geometryResPath !== '')
        {
            this.geometryResource = resMan.GetResource(this.geometryResPath);
        }
    }

    /**
     * Checks if the mesh's resource is good
     * @returns {boolean}
     */
    IsGood()
    {
        return this.geometryResource && this.geometryResource.IsGood();
    }

    /**
     * Gets mesh resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (!out.includes(this.geometryResource))
        {
            out.push(this.geometryResource);
        }

        util.perArrayChild(this.opaqueAreas, 'GetResources', out);
        util.perArrayChild(this.transparentAreas, 'GetResources', out);
        util.perArrayChild(this.additiveAreas, 'GetResources', out);
        util.perArrayChild(this.pickableAreas, 'GetResources', out);
        util.perArrayChild(this.decalAreas, 'GetResources', out);
        util.perArrayChild(this.depthAreas, 'GetResources', out);
        return out;
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.IsGood() || !this.display) return false;

        const getBatches = this.constructor.GetAreaBatches;
        switch (mode)
        {
            case device.RM_OPAQUE:
                if (this.visible.opaqueAreas)
                {
                    getBatches(this, this.opaqueAreas, mode, accumulator, perObjectData);
                }
                return;

            case device.RM_DECAL:
                if (this.visible.decalAreas)
                {
                    getBatches(this, this.opaqueAreas, mode, accumulator, perObjectData);
                }
                return;

            case device.RM_TRANSPARENT:
                if (this.visible.transparentAreas)
                {
                    getBatches(this, this.transparentAreas, mode, accumulator, perObjectData);
                }
                return;

            case device.RM_ADDITIVE:
                if (this.visible.transparentAreas)
                {
                    getBatches(this, this.additiveAreas, mode, accumulator, perObjectData);
                }
                return;

            case device.RM_PICKABLE:
                if (this.visible.pickableAreas)
                {
                    getBatches(this, this.pickableAreas, mode, accumulator, perObjectData);
                }
                return;
        }
    }

    /**
     * Gets render batches from a mesh area array and commits them to an accumulator
     * @param {Tw2Mesh} mesh
     * @param {Array.<Tw2MeshArea>} areas
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    static GetAreaBatches(mesh, areas, mode, accumulator, perObjectData)
    {
        for (let i = 0; i < areas.length; ++i)
        {
            const area = areas[i];
            if (area.effect && area.display)
            {
                const batch = new area.constructor.batchType();
                batch.renderMode = mode;
                batch.perObjectData = perObjectData;
                batch.geometryRes = mesh.geometryResource;
                batch.meshIx = mesh.meshIndex;
                batch.start = area.index;
                batch.count = area.count;
                batch.effect = area.effect;
                accumulator.Commit(batch);
            }
        }
    }

}