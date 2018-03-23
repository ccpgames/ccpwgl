import {Tw2RenderBatch} from './Tw2RenderBatch';

/**
 * A render batch that uses geometry provided from an external source
 *
 * @property {*} geometryProvider
 * @class
 */
export class Tw2ForwardingRenderBatch extends Tw2RenderBatch
{
    constructor()
    {
        super();
        this.geometryProvider = null;
    }

    /**
     * Commits the batch for rendering
     * @param {Tw2Effect} [effect] - An optional override effect
     */
    Commit(effect)
    {
        if (this.geometryProvider)
        {
            this.geometryProvider.Render(this, effect);
        }
    }
}
