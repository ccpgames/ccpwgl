import {Tw2RenderBatch} from './Tw2RenderBatch';

/**
 * A render batch that uses geometry provided from an external source
 *
 * @property {*} geometryProvider
 * @class
 */
export class Tw2ForwardingRenderBatch extends Tw2RenderBatch
{

    geometryProvider = null;


    /**
     * Commits the batch for rendering
     * @param {string} technique - technique name
     */
    Commit(technique)
    {
        if (this.geometryProvider)
        {
            this.geometryProvider.Render(this, technique);
        }
    }

}
