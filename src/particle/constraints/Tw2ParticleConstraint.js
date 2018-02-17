/* eslint no-unused-vars:0 */

/**
 * Tw2ParticleConstraint base class
 * - Not implemented yet
 *
 * @property {string} name
 */
export class Tw2ParticleConstraint
{
    constructor()
    {
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