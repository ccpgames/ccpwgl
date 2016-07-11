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
    this._tempVec = vec3.create();
}

/**
 * ApplyForce
 * @param position
 * @param velocity
 * @param force
 */
Tw2ParticleAttractorForce.prototype.ApplyForce = function(position, velocity, force)
{
    this._tempVec[0] = this.position[0] - position.buffer[position.offset];
    this._tempVec[1] = this.position[1] - position.buffer[position.offset + 1];
    this._tempVec[2] = this.position[2] - position.buffer[position.offset + 2];
    vec3.normalize(this._tempVec, this._tempVec);
    vec3.scale(this._tempVec, this._tempVec, this.magnitude);
    vec3.add(force, force, this._tempVec);
};

/**
 * Internal render/update function. It is called every frame.
 */
Tw2ParticleAttractorForce.prototype.Update = function() {};
