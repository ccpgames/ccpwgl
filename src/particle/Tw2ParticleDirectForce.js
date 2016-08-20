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
 */
Tw2ParticleDirectForce.prototype.ApplyForce = function(position, velocity, force)
{
    vec3.add(force, force, this.force);
};

/**
 * Internal render/update function. It is called every frame.
 */
Tw2ParticleDirectForce.prototype.Update = function() {};
