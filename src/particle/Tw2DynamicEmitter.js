function Tw2DynamicEmitter()
{
    this.name = '';
    this.rate = 0;
    this.isValid = false;
    this.particleSystem = null;
    this._accumulatedRate = 0;
    this.generators = [];
}

Tw2DynamicEmitter.prototype.Initialize = function ()
{
    this.Rebind();
};

Tw2DynamicEmitter.prototype.Update = function (dt)
{
    this.SpawnParticles(null, null, Math.min(dt, 0.1));
};

Tw2DynamicEmitter.prototype.Rebind = function ()
{
    this.isValid = false;
    if (!this.particleSystem)
    {
        return;
    }
    for (var i = 0; i < this.generators.length; ++i)
    {
        if (!this.generators[i].Bind(this.particleSystem))
        {
            return;
        }
    }
    this.isValid = true;
};

Tw2DynamicEmitter.prototype.SpawnParticles = function (position, velocity, rateModifier)
{
    if (!this.isValid)
    {
        return;
    }
    this._accumulatedRate += this.rate * rateModifier;
    var count = Math.floor(this._accumulatedRate);
    this._accumulatedRate -= count;
    for (var i = 0; i < count; ++i)
    {
        var index = this.particleSystem.BeginSpawnParticle();
        if (index == null)
        {
            break;
        }
        for (var j = 0; j < this.generators.length; ++j)
        {
            this.generators[j].Generate(position, velocity, index);
        }
        this.particleSystem.EndSpawnParticle();
    }
};
