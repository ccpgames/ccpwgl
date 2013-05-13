function Tw2BatchAccumulator(sorting)
{
    this.batches = [];
    this.count = 0;
    this._sortMethod = sorting;
}

Tw2BatchAccumulator.prototype.Commit = function (batch)
{
    this.batches[this.count++] = batch;
};

Tw2BatchAccumulator.prototype.Clear = function ()
{
    this.count = 0;
};

Tw2BatchAccumulator.prototype.Render = function (overrideEffect)
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

function Tw2RenderBatch()
{
    this.renderMode = device.RM_ANY;
    this.perObjectData = null;
}

function Tw2ForwardingRenderBatch()
{
    this.geometryProvider = null;
}

Tw2ForwardingRenderBatch.prototype.Commit = function (overrideEffect)
{
    if (this.geometryProvider)
    {
        this.geometryProvider.Render(this, overrideEffect);
    }
};

Inherit(Tw2ForwardingRenderBatch, Tw2RenderBatch);
