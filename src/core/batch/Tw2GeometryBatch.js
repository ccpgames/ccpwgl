import {Tw2RenderBatch} from './Tw2RenderBatch';

/**
 * A render batch for geometry
 *
 * @property {Tw2GeometryRes} geometryRes
 * @property {Number} meshIx
 * @property {Number} start
 * @property {Number} count
 * @property {Tw2Effect} effect
 * @class
 */
export class Tw2GeometryBatch extends Tw2RenderBatch
{
    constructor()
    {
        super();
        this.geometryRes = null;
        this.meshIx = 0;
        this.start = 0;
        this.count = 1;
        this.effect = null;
    }

    /**
     * Commits the Tw2InstancedMeshBatch for rendering
     * @param {Tw2Effect} [effect=this.effect] An optional override effect
     */
    Commit(effect = this.effect)
    {
        if (this.geometryRes && effect)
        {
            this.geometryRes.RenderAreas(this.meshIx, this.start, this.count, effect);
        }
    }
}

