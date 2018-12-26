import {mat4} from '../../global';
import {Tw2BasicPerObjectData} from '../../core';
import {EveChild} from './EveChild';

/**
 * Particle system attachment to space object
 *
 * @property {Tw2Mesh} mesh
 * @property {Array<Tw2ParticleEmitter>} particleEmitters
 * @property {Array<Tw2ParticleSystem>} particleSystems
 * @property {Tw2BasicPerObjectData} _perObjectData
 * @class
 */
export class EveChildParticleSystem extends EveChild
{

    mesh = null;
    particleEmitters = [];
    particleSystems = [];
    _perObjectData = new Tw2BasicPerObjectData(EveChild.perObjectData);


    /**
     * Gets the child's resources
     * @param {Array} [out=[]]
     * @returns {Array.<Tw2Resource>} out
     */
    GetResources(out)
    {
        if (this.mesh) this.mesh.GetResources(out);
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

        for (let i = 0; i < this.particleEmitters.length; ++i)
        {
            this.particleEmitters[i].Update(dt);
        }

        for (let i = 0; i < this.particleSystems.length; ++i)
        {
            this.particleSystems[i].Update(dt);
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (this.display && this.mesh)
        {
            mat4.transpose(this._perObjectData.perObjectFFEData.Get('world'), this.worldTransform);
            mat4.invert(this._perObjectData.perObjectFFEData.Get('worldInverseTranspose'), this.worldTransform);
            this.mesh.GetBatches(mode, accumulator, this._perObjectData);
        }
    }

}