/* eslint no-unused-vars:0 */
import {util} from '../../math';

/**
 * Tw2ParticleConstraint base class
 * - Not implemented yet
 *
 * @property {string|number} _id
 * @property {string} name
 */
export class Tw2ParticleConstraint
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
    }

    /**
     * Applies constraints
     * @param {Array} buffers
     * @param {Array} instanceStride
     * @param {number} aliveCount
     * @param {number} dt
     */
    ApplyConstraint(buffers, instanceStride, aliveCount, dt)
    {

    }
}