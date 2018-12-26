import {Tw2RenderBatch} from './Tw2RenderBatch';

/**
 * A render batch for geometry
 *
 * @property {Tw2GeometryRes} geometryRes
 * @property {Number} meshIx
 * @property {Number} start
 * @property {Number} count
 * @property {Tw2Effect} effect
 * @property {string} technique
 * @class
 */
export class Tw2GeometryBatch extends Tw2RenderBatch
{

    geometryRes = null;
    meshIx = 0;
    start = 0;
    count = 1;
    effect = null;


    /**
     * Commits the Tw2InstancedMeshBatch for rendering
     * @param {string} technique - technique name
     */
    Commit(technique)
    {
        if (this.geometryRes && this.effect)
        {
            this.geometryRes.RenderAreas(this.meshIx, this.start, this.count, this.effect, technique);
        }
    }

}

