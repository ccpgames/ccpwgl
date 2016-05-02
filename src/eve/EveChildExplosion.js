/**
 * "Complex" explosion object. Not implemented.
 * @property {boolean} isEffectChild
 * @constructor
 */
function EveChildExplosion()
{
    // will be implemented soon(tm)
    this.isEffectChild = true;
}

/**
 * Updates explosion transform
 * @param {mat4} parentTransform
 */
EveChildExplosion.prototype.Update = function (parentTransform)
{
};

/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 */
EveChildExplosion.prototype.GetBatches = function (mode, accumulator, perObjectData)
{
};