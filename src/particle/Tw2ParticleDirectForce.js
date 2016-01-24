/**
 * Tw2ParticleDirectForce
 * @property {vec3} force
 * @constructor
 */
function Tw2ParticleDirectForce()
{
    this.force = vec3.create();
}

/**
 * ApplyForce
 * @param position
 * @param velocity
 * @param force
 * @prototype
 */
Tw2ParticleDirectForce.prototype.ApplyForce = function(position, velocity, force)
{
    force[0] += this.force[0];
    force[1] += this.force[1];
    force[2] += this.force[2];
};

/**
 * Internal render/update function. It is called every frame.
 * @prototype
 */
Tw2ParticleDirectForce.prototype.Update = function() {};
