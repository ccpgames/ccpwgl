/**
 * Tw2ParticleAttractorForce
 * @property {number} magnitude
 * @property {vec3} position
 * @property {vec3} _tempVec
 * @constructor
 */
function Tw2ParticleAttractorForce()
{
    this.magnitude = 0;
    this.position = vec3.create();
}

/**
 * Scratch variables
 */
Tw2ParticleAttractorForce.scratch = {
    vec3_0: vec3.create()
};

/**
 * ApplyForce
 * @param position
 * @param velocity
 * @param force
 * @prototype
 */
Tw2ParticleAttractorForce.prototype.ApplyForce = function(position, velocity, force)
{
    var v0 = Tw2ParticleAttractorForce.scratch.vec3_0;

    v0[0] = this.position[0] - position.buffer[position.offset];
    v0[1] = this.position[1] - position.buffer[position.offset + 1];
    v0[2] = this.position[2] - position.buffer[position.offset + 2];

    vec3.normalize(v0, v0);
    vec3.scale(v0, v0, this.magnitude);
    vec3.add(force, force, v0);
};

/**
 * Internal render/update function. It is called every frame.
 * @prototype
 */
Tw2ParticleAttractorForce.prototype.Update = function() {};
