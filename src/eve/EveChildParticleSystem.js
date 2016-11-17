/**
 * Particle system attachment to space object
 * @property {string} name
 * @property {boolean} display
 * @property {Number} lowestLodVisible
 * @property {quat4} rotation
 * @property {vec3} translation
 * @property {vec3} scaling
 * @property {boolean} useSRT
 * @property {boolean} staticTransform
 * @property {mat4} localTransform
 * @property {mat4} worldTransform
 * @property {mat4} worldTransformLast
 * @property {Tw2Mesh} mesh
 * @property {[{]} particleEmitters
 * @property {[Tw2ParticleSystem]} particleSystems
 * @property {boolean} isEffectChild
 * @property {EveBasicPerObjectData} _perObjectData
 * @constructor
 */
function EveChildParticleSystem()
{
    this.name = '';
    this.display = true;
    this.lowestLodVisible = 2;
    this.rotation = quat4.create([0, 0, 0, 1]);
    this.translation = vec3.create();
    this.scaling = vec3.create([1, 1, 1]);
    this.useSRT = true;
    this.staticTransform = false;
    this.localTransform = mat4.create();
    this.worldTransform = mat4.create();
    this.worldTransformLast = mat4.create();
    this.mesh = null;

    this.particleEmitters = [];
    this.particleSystems = [];

    this.isEffectChild = true;

    this._perObjectData = new EveBasicPerObjectData();
    this._perObjectData.perObjectFFEData = new Tw2RawData();
    this._perObjectData.perObjectFFEData.Declare('world', 16);
    this._perObjectData.perObjectFFEData.Declare('worldInverseTranspose', 16);
    this._perObjectData.perObjectFFEData.Create();
}

/**
 * Updates object transform and ticks particle systems and emitters
 * @param {mat4} parentTransform
 * @param {Number} dt
 */
EveChildParticleSystem.prototype.Update = function(parentTransform, dt)
{
    if (this.useSRT)
    {
        var temp = this.worldTransformLast;
        mat4.identity(this.localTransform);
        mat4.translate(this.localTransform, this.translation);
        mat4.transpose(quat4.toMat4(quat4.normalize(this.rotation), temp));
        mat4.multiply(this.localTransform, temp, this.localTransform);
        mat4.scale(this.localTransform, this.scaling);
    }
    mat4.set(this.worldTransform, this.worldTransformLast);
    mat4.multiply(parentTransform, this.localTransform, this.worldTransform);

    for (var i = 0; i < this.particleEmitters.length; ++i)
    {
        this.particleEmitters[i].Update(dt);
    }
    for (i = 0; i < this.particleSystems.length; ++i)
    {
        this.particleSystems[i].Update(dt);
    }
};


/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 */
EveChildParticleSystem.prototype.GetBatches = function(mode, accumulator)
{
    if (!this.display || !this.mesh)
    {
        return;
    }
    mat4.transpose(this.worldTransform, this._perObjectData.perObjectFFEData.Get('world'));
    mat4.inverse(this.worldTransform, this._perObjectData.perObjectFFEData.Get('worldInverseTranspose'));

    this.mesh.GetBatches(mode, accumulator, this._perObjectData);

};



/**
 * Gets child mesh res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
 */
EveChildParticleSystem.prototype.GetResources = function(out)
{
    if (out === undefined)
    {
        out = [];
    }

    if (this.mesh !== null)
    {
        this.mesh.GetResources(out);
    }

    return out;
};
