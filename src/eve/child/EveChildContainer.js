import {EveChild} from './EveChild';

/**
 * Container for other child effects
 *
 * @parameter {Array.<{}>} objects
 * @parameter {Array.<Tw2CurveSet>} curveSets
 * @class
 */
export class EveChildContainer extends EveChild
{
    constructor()
    {
        super();
        this.objects = [];
        this.curveSets = [];
    }

    /**
     * Gets the child's resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out=[])
    {
        for (let i = 0; i < this.objects.length; i++)
        {
            if ('GetResources' in this.objects[i])
            {
                this.objects[i].GetResources(out);
            }
        }
        return out;
    }

    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     */
    Update(dt, parentTransform)
    {
        super.Update(dt, parentTransform);

        for (let i = 0; i < this.curveSets.length; i++)
        {
            this.curveSets[i].Update(dt);
        }

        for (let i = 0; i < this.objects.length; i++)
        {
            this.objects[i].Update(dt, this.worldTransform);
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (this.display)
        {
            for (let i = 0; i < this.objects.length; i++)
            {
                this.objects[i].GetBatches(mode, accumulator, perObjectData);
            }
        }
    }
}
