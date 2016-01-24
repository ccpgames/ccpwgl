/**
 * Tw2ParticleDragForce
 * @property {number} drag
 * @constructor
 */
function Tw2ParticleDragForce()
{
    this.drag = 0.1;
}

/**
 * ApplyForce
 * @param position
 * @param velocity
 * @param force
 * @prototype
 */
Tw2ParticleDragForce.prototype.ApplyForce = function(position, velocity, force)
{
    force[0] += velocity.buffer[velocity.offset] * -this.drag;
    force[1] += velocity.buffer[velocity.offset + 1] * -this.drag;
    force[2] += velocity.buffer[velocity.offset + 2] * -this.drag;
};

/**
 * Internal render/update function. It is called every frame.
 * @prototype
 */
Tw2ParticleDragForce.prototype.Update = function() {};
