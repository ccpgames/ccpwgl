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
    this._tempVec = vec3.create();
    this._tempVec2 = vec3.create();
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
    var speed = Math.sqrt(
        velocity.buffer[velocity.offset] * velocity.buffer[velocity.offset] +
        velocity.buffer[velocity.offset + 1] * velocity.buffer[velocity.offset + 1] +
        velocity.buffer[velocity.offset + 2] * velocity.buffer[velocity.offset + 2]);
    this._tempVec[0] = velocity.buffer[velocity.offset] * -speed * this.drag;
    this._tempVec[1] = velocity.buffer[velocity.offset + 1] * -speed * this.drag;
    this._tempVec[2] = velocity.buffer[velocity.offset + 2] * -speed * this.drag;

    vec3.scale(this._tempVec, dt * mass, this._tempVec2);
    this._tempVec2[0] += velocity.buffer[velocity.offset];
    this._tempVec2[1] += velocity.buffer[velocity.offset + 1];
    this._tempVec2[2] += velocity.buffer[velocity.offset + 2];
    var dot = velocity.buffer[velocity.offset] * this._tempVec2[0] +
        velocity.buffer[velocity.offset + 1] * this._tempVec2[1] +
        velocity.buffer[velocity.offset + 2] * this._tempVec2[2];
    if (dot < 0)
    {
        force[0] = -velocity.buffer[velocity.offset] / dt / mass;
        force[1] = -velocity.buffer[velocity.offset + 1] / dt / mass;
        force[2] = -velocity.buffer[velocity.offset + 2] / dt / mass;
    }
    else
    {
        vec3.set(this._tempVec, force);
    }
};

/**
 * Internal render/update function. It is called every frame.
 * @prototype
 */
Tw2ParticleFluidDragForce.prototype.Update = function() {};
