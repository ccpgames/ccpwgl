import {Tw2GeometryBatch} from './Tw2GeometryBatch';

/**
 * A render batch for line geometry
 *
 * @class
 */
export class Tw2GeometryLineBatch extends Tw2GeometryBatch
{
    constructor()
    {
        super();
    }

    /**
     * Commits the Geometry Line Batch for rendering
     * @param {Tw2Effect} [effect=this.effect] An optional override effect
     */
    Commit(effect = this.effect)
    {
        if (this.geometryRes && effect)
        {
            this.geometryRes.RenderLines(this.meshIx, this.start, this.count, effect);
        }
    }
}
