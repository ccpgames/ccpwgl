/**
 * Tw2ParticleSpring
 * @property {number} springConstant
 * @property {vec3} position
 * @constructor
 */
function Tw2ParticleSpring()
{
    this.springConstant = 0;
    this.position = vec3.create();
}

/**
 * ApplyForce
 * @param position
 * @param velocity
 * @param force
 * @prototype
 */
Tw2ParticleSpring.prototype.ApplyForce = function(position, velocity, force)
{
    force[0] += (this.position[0] - position.buffer[position.offset]) * this.springConstant;
    force[1] += (this.position[1] - position.buffer[position.offset + 1]) * this.springConstant;
    force[2] += (this.position[2] - position.buffer[position.offset + 2]) * this.springConstant;
};

/**
 * Internal render/update function. It is called every frame.
 * @prototype
 */
Tw2ParticleSpring.prototype.Update = function() {};
