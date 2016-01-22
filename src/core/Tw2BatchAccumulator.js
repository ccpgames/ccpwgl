/**
 * Accumulates render batches for rendering
 * @param {function} [sorting] - An optional function for sorting the collected render batches
 * @property {Array.<RenderBatch>} batches
 * @property {number} count - How many batch array elements will be processed
 * @property {function} _sortMethod - the stored sorting function
 * @constructor
 */
function Tw2BatchAccumulator(sorting)
{
    this.batches = [];
    this.count = 0;
    this._sortMethod = (sorting) ? sorting : undefined;
}

/**
 * Commits a batch to accumulation
 * @param {RenderBatch} batch
 * @prototype
 */
Tw2BatchAccumulator.prototype.Commit = function(batch)
{
    this.batches[this.count++] = batch;
};

/**
 * Clears any accumulated render batches
 * @prototype
 */
Tw2BatchAccumulator.prototype.Clear = function()
{
    this.count = 0;
    this.batches = [];
};

/**
 * Renders the accumulated render batches
 * - If a sorting function has been defined the render batches will be sorted before rendering
 * @param {Tw2Effect} [overrideEffect]
 * @prototype
 */
Tw2BatchAccumulator.prototype.Render = function(overrideEffect)
{
    if (typeof(this._sortMethod) != 'undefined')
    {
        this.batches.sort(this._sortMethod);
    }
    for (var i = 0; i < this.count; ++i)
    {
        if (this.batches[i].renderMode != device.RM_ANY)
        {
            device.SetStandardStates(this.batches[i].renderMode);
        }
        device.perObjectData = this.batches[i].perObjectData;
        this.batches[i].Commit(overrideEffect);
    }
};


/**
 * A standard render batch
 * @property {RenderMode} renderMode
 * @property {Tw2PerObjectData} perObjectData
 * @constructor
 */
function Tw2RenderBatch()
{
    this.renderMode = device.RM_ANY;
    this.perObjectData = null;
}


/**
 * A render batch that uses geometry provided from an external source
 * @property {GeometryProvider} geometryProvider
 * @inherits Tw2RenderBatch
 * @constructor
 */
function Tw2ForwardingRenderBatch()
{
    this.geometryProvider = null;
}

/**
 * Commits the batch for rendering
 * @param {Tw2Effect} [overrideEffect]
 * @prototype
 */
Tw2ForwardingRenderBatch.prototype.Commit = function(overrideEffect)
{
    if (this.geometryProvider)
    {
        this.geometryProvider.Render(this, overrideEffect);
    }
};

Inherit(Tw2ForwardingRenderBatch, Tw2RenderBatch);
