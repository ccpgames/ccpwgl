/**
 * Container for other child effects
 * @property {string} name
 * @property {boolean} display
 * @parameter {Array.<{}>} objects
 * @parameter {Array.<{}>} curveSets
 * @property {quat4} rotation
 * @property {vec3} translation
 * @property {vec3} scaling
 * @property {boolean} useSRT
 * @property {boolean} staticTransform
 * @property {mat4} localTransform
 * @property {mat4} worldTransform
 * @property {mat4} worldTransformLast
 * @property {boolean} isEffectChild
 * @constructor
 */
function EveChildContainer()
{
    this.name = '';
    this.display = true;
    this.objects = [];
    this.curveSets = [];

    this.rotation = quat4.create([0, 0, 0, 1]);
    this.translation = vec3.create();
    this.scaling = vec3.create([1, 1, 1]);
    this.useSRT = true;
    this.staticTransform = false;
    this.localTransform = mat4.create();
    this.worldTransform = mat4.create();
    this.worldTransformLast = mat4.create();

    this.isEffectChild = true;
}

/**
 * Updates container transform, curve sets and all children
 * @param {mat4} parentTransform
 * @param {Number} dt
 */
EveChildContainer.prototype.Update = function(parentTransform, dt)
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

    for (var i = 0; i < this.curveSets.length; ++i)
    {
        this.curveSets[i].Update(dt);
    }
    for (i = 0; i < this.objects.length; ++i)
    {
        this.objects[i].Update(this.worldTransform, dt);
    }
};


/**
 * Gets render batches from children
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 */
EveChildContainer.prototype.GetBatches = function(mode, accumulator, perObjectData)
{
    if (!this.display)
    {
        return;
    }
    for (var i = 0; i < this.objects.length; ++i)
    {
        this.objects[i].GetBatches(mode, accumulator, perObjectData);
    }
};



/**
 * Gets child mesh res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
 */
EveChildContainer.prototype.GetResources = function(out)
{
    if (out === undefined)
    {
        out = [];
    }

    for (var i = 0; i < this.objects.length; ++i)
    {
        this.objects[i].GetResources(out);
    }
    return out;
};