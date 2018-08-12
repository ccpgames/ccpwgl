import {vec4} from '../../global';
import {Tw2ParticleElementDeclaration} from '../Tw2ParticleElement';
import {Tw2ParticleAttributeGenerator} from './Tw2ParticleAttributeGenerator';

/**
 * Tw2RandomIntegerAttributeGenerator
 *
 * @property {number} elementType
 * @property {string} customName
 * @property {vec4} minRange
 * @property {vec4} maxRange
 * @property {Tw2ParticleElement} _element
 * @inherits Tw2ParticleAttributeGenerator
 * @class
 */
export class Tw2RandomIntegerAttributeGenerator extends Tw2ParticleAttributeGenerator
{
    constructor()
    {
        super();
        this.elementType = Tw2ParticleElementDeclaration.Type.CUSTOM;
        this.customName = '';
        this.minRange = vec4.create();
        this.maxRange = vec4.create();
        this._element = null;
    }

    /**
     * Binds a particle system element to the generator
     * @param {Tw2ParticleSystem} ps
     * @returns {boolean} True if successfully bound
     */
    Bind(ps)
    {
        for (let i = 0; i < ps._elements.length; ++i)
        {
            if
            (
                ps._elements[i].elementType === this.elementType &&
                (this.elementType !== Tw2ParticleElementDeclaration.Type.CUSTOM || ps._elements[i].customName === this.customName)
            )
            {
                this._element = ps._elements[i];
                return true;
            }
        }
        return false;
    }

    /**
     * Generates the attributes
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {number} index
     */
    Generate(position, velocity, index)
    {
        for (let i = 0; i < this._element.dimension; ++i)
        {
            this._element.buffer[this._element.instanceStride * index + this._element.startOffset + i] =
                Math.floor(this.minRange[i] + Math.random() * (this.maxRange[i] - this.minRange[i]) + 0.5);
        }
    }
}
