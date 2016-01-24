/**
 * Tw2SphereShapeAttributeGenerator
 * @property {number} minRadius
 * @property {number} maxRadius
 * @property {number} minPhi
 * @property {number} maxPhi
 * @property {number} minTheta
 * @property {number} maxTheta
 * @property {boolean} controlPosition
 * @property {boolean} controlVelocity
 * @property {number} minSpeed
 * @property {number} maxSpeed
 * @property {number} parentVelocityFactor
 * @property {vec3} position
 * @property {quat4} rotation
 * @property _position
 * @property _velocity
 * @constructor
 */
function Tw2SphereShapeAttributeGenerator()
{
    this.minRadius = 0;
    this.maxRadius = 0;
    this.minPhi = 0;
    this.maxPhi = 360;
    this.minTheta = 0;
    this.maxTheta = 360;
    this.controlPosition = true;
    this.controlVelocity = true;
    this.minSpeed = 0;
    this.maxSpeed = 0;
    this.parentVelocityFactor = 1;
    this.position = vec3.create();
    this.rotation = quat4.create([0, 0, 0, 1]);
    this._position = null;
    this._velocity = null;
}

/**
 * Bind
 * @param ps
 * @returns {boolean}
 * @prototype
 */
Tw2SphereShapeAttributeGenerator.prototype.Bind = function(ps)
{
    this._position = null;
    this._velocity = null;
    for (var i = 0; i < ps._elements.length; ++i)
    {
        if (ps._elements[i].elementType == Tw2ParticleElementDeclaration.POSITION && this.controlPosition)
        {
            this._position = ps._elements[i];
        }
        else if (ps._elements[i].elementType == Tw2ParticleElementDeclaration.VELOCITY && this.controlVelocity)
        {
            this._velocity = ps._elements[i];
        }
    }
    return (!this.controlPosition || this._position != null) && (!this.controlVelocity || this._velocity != null);
};

/**
 * Generate
 * @param position
 * @param velocity
 * @param index
 * @prototype
 */
Tw2SphereShapeAttributeGenerator.prototype.Generate = function(position, velocity, index)
{
    var offset;

    var phi = (this.minPhi + Math.random() * (this.maxPhi - this.minPhi)) / 180 * Math.PI;
    var theta = (this.minTheta + Math.random() * (this.maxTheta - this.minTheta)) / 180 * Math.PI;

    var rv = vec3.create();
    rv[0] = Math.sin(phi) * Math.cos(theta);
    rv[1] = -Math.cos(phi);
    rv[2] = Math.sin(phi) * Math.sin(theta);

    quat4.multiplyVec3(this.rotation, rv);
    if (this._velocity)
    {
        var speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);
        offset = this._velocity.instanceStride * index + this._velocity.startOffset;
        this._velocity.buffer[offset] = rv[0] * speed;
        this._velocity.buffer[offset + 1] = rv[1] * speed;
        this._velocity.buffer[offset + 2] = rv[2] * speed;
        if (velocity)
        {
            this._velocity.buffer[offset] += velocity.buffer[velocity.offset] * this.parentVelocityFactor;
            this._velocity.buffer[offset + 1] += velocity.buffer[velocity.offset + 1] * this.parentVelocityFactor;
            this._velocity.buffer[offset + 2] += velocity.buffer[velocity.offset + 2] * this.parentVelocityFactor;
        }
    }

    if (this._position)
    {
        vec3.scale(rv, this.minRadius + Math.random() * (this.maxRadius - this.minRadius));
        vec3.add(rv, this.position);
        if (position)
        {
            rv[0] += position.buffer[position.offset];
            rv[1] += position.buffer[position.offset + 1];
            rv[2] += position.buffer[position.offset + 2];
        }
        offset = this._position.instanceStride * index + this._position.startOffset;
        this._position.buffer[offset] = rv[0];
        this._position.buffer[offset + 1] = rv[1];
        this._position.buffer[offset + 2] = rv[2];
    }
};
