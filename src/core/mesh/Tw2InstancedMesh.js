import {vec3, resMan} from '../../global';
import {Tw2InstancedMeshBatch} from '../batch';
import {Tw2Mesh} from './Tw2Mesh';

/**
 * Tw2InstancedMesh
 *
 * @property instanceGeometryResource
 * @property {string} instanceGeometryResPath
 * @property {number} instanceMeshIndex
 * @property {vec3} minBounds
 * @property {vec3} maxBounds
 * @class
 */
export class Tw2InstancedMesh extends Tw2Mesh
{

    instanceGeometryResource = null;
    instanceGeometryResPath = '';
    instanceMeshIndex = 0;
    minBounds = vec3.create();
    maxBounds = vec3.create();


    /**
     * Initializes the instanced mesh
     */
    Initialize()
    {
        super.Initialize();
        if (this.instanceGeometryResPath !== '')
        {
            this.instanceGeometryResource = resMan.GetResource(this.instanceGeometryResPath);
        }
    }

    /**
     * Checks if the instances meshes' resources are good
     * @returns {boolean}
     */
    IsGood()
    {
        const
            instanced = this.instanceGeometryResource,
            isResGood = super.IsGood(),
            isInstancedResGood = !instanced ? false : instanced.IsGood ? instanced.IsGood() : true;

        return isResGood && isInstancedResGood;
    }

    /**
     * Gets mesh resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        super.GetResources(out);
        if (this.instanceGeometryResource && 'GetResources' in this.instanceGeometryResource)
        {
            this.instanceGeometryResource.GetResources(out);
        }
        return out;
    }

    /**
     * RenderAreas
     * @param {number} meshIx
     * @param {number} start
     * @param {number} count
     * @param {Tw2Effect} effect
     * @param {string} technique
     */
    RenderAreas(meshIx, start, count, effect, technique)
    {
        if (!this.IsGood()) return;

        const buffer = this.instanceGeometryResource.GetInstanceBuffer(this.instanceMeshIndex);
        if (buffer)
        {
            this.geometryResource.RenderAreasInstanced(meshIx, start, count, effect, technique,
                buffer,
                this.instanceGeometryResource.GetInstanceDeclaration(this.instanceMeshIndex),
                this.instanceGeometryResource.GetInstanceStride(this.instanceMeshIndex),
                this.instanceGeometryResource.GetInstanceCount(this.instanceMeshIndex));
        }
    }

    /**
     * Gets area batches
     * @param {Tw2InstancedMesh} mesh
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
                const batch = new Tw2InstancedMeshBatch();
                batch.renderMode = mode;
                batch.perObjectData = perObjectData;
                batch.instanceMesh = mesh;
                batch.meshIx = area.meshIndex;
                batch.start = area.index;
                batch.count = area.count;
                batch.effect = area.effect;
                accumulator.Commit(batch);
            }
        }
    }

}

