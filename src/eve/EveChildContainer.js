/**
 * Container for other child effects
 * @property {string} name
 * @property {boolean} display
 * @parameter {Array.<{}>} objects
 * @parameter {Array.<{}>} curveSets
 * @property {quat} rotation
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

    this.rotation = quat.create();
    this.translation = vec3.create();
    this.scaling = vec3.fromValues(1, 1, 1);
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
        quat.normalize(this.rotation, this.rotation);
        mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
    }

    mat4.copy(this.worldTransformLast, this.worldTransform);
    mat4.multiply(this.worldTransform, parentTransform, this.localTransform);

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
