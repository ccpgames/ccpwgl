function Tw2ParticleDirectForce()
{
    this.force = vec3.create();
}

Tw2ParticleDirectForce.prototype.ApplyForce = function (position, velocity, force)
{
    force[0] += this.force[0];
    force[1] += this.force[1];
    force[2] += this.force[2];
};

Tw2ParticleDirectForce.prototype.Update = function () { };

