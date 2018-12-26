import {Tw2GeometryBatch} from './Tw2GeometryBatch';

/**
 * A render batch for line geometry
 *
 * @class
 */
export class Tw2GeometryLineBatch extends Tw2GeometryBatch
{

    /**
     * Commits the Geometry Line Batch for rendering
     * @param {string} technique - technique name
     */
    Commit(technique)
    {
        if (this.geometryRes && this.effect)
        {
            this.geometryRes.RenderLines(this.meshIx, this.start, this.count, this.effect, technique);
        }
    }

}
