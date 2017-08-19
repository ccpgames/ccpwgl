/* global vec3 */

/**
 * Tw2ParticleFluidDragForce
 * @property {number} drag
 * @property {vec3} _tempVec
 * @property {vec3} _tempVec2
 * @constructor
 */
function Tw2ParticleFluidDragForce()
{
    this.drag = 0.1;

    var scratch = Tw2ParticleFluidDragForce.scratch;
    if (!scratch.vec3_0)
    {
        scratch.vec3_0 = vec3.create();
        scratch.vec3_1 = vec3.create();
    }
}

/**
 * ApplyForce
 * @param position
 * @param velocity
 * @param force
 * @param {number} dt - delta time
 * @param mass
 * @prototype
 */
Tw2ParticleFluidDragForce.prototype.ApplyForce = function(position, velocity, force, dt, mass)
{
    var v0 = Tw2ParticleFluidDragForce.scratch.vec3_0,
        v1 = Tw2ParticleFluidDragForce.scratch.vec3_1;
    
    var speed = Math.sqrt(
        velocity.buffer[velocity.offset] * velocity.buffer[velocity.offset] +
        velocity.buffer[velocity.offset + 1] * velocity.buffer[velocity.offset + 1] +
        velocity.buffer[velocity.offset + 2] * velocity.buffer[velocity.offset + 2]);

    v0[0] = velocity.buffer[velocity.offset] * -speed * this.drag;
    v0[1] = velocity.buffer[velocity.offset + 1] * -speed * this.drag;
    v0[2] = velocity.buffer[velocity.offset + 2] * -speed * this.drag;

    vec3.scale(v1, v0, dt * mass);
    v1[0] += velocity.buffer[velocity.offset];
    v1[1] += velocity.buffer[velocity.offset + 1];
    v1[2] += velocity.buffer[velocity.offset + 2];
    var dot = velocity.buffer[velocity.offset] * v1[0] +
        velocity.buffer[velocity.offset + 1] * v1[1] +
        velocity.buffer[velocity.offset + 2] * v1[2];
    if (dot < 0)
    {
        force[0] = -velocity.buffer[velocity.offset] / dt / mass;
        force[1] = -velocity.buffer[velocity.offset + 1] / dt / mass;
        force[2] = -velocity.buffer[velocity.offset + 2] / dt / mass;
    }
    else
    {
        vec3.copy(force, v0);
    }
};

/**
 * Internal render/update function. It is called every frame.
 * @prototype
 */
Tw2ParticleFluidDragForce.prototype.Update = function() {};

/**
 * Scratch variables
 */
Tw2ParticleFluidDragForce.scratch = {
    vec3_0 : null,
    vec3_1 : null
};