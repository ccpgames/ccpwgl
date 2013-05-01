function Tw2ParticleDragForce()
{
    this.drag = 0.1;
}

Tw2ParticleDragForce.prototype.ApplyForce = function (position, velocity, force)
{
    force[0] += velocity.buffer[velocity.offset] * -this.drag;
    force[1] += velocity.buffer[velocity.offset + 1] * -this.drag;
    force[2] += velocity.buffer[velocity.offset + 2] * -this.drag;
};

Tw2ParticleDragForce.prototype.Update = function () { };

