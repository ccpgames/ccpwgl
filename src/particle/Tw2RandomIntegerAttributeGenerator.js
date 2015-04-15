function Tw2RandomIntegerAttributeGenerator()
{
    this.elementType = Tw2ParticleElementDeclaration.CUSTOM;
    this.customName = '';
    this.minRange = quat4.create();
    this.maxRange = quat4.create();
    this._element = null;
}

Tw2RandomIntegerAttributeGenerator.prototype.Bind = function(ps)
{
    for (var i = 0; i < ps._elements.length; ++i)
    {
        if (ps._elements[i].elementType == this.elementType &&
            (this.elementType != Tw2ParticleElementDeclaration.CUSTOM || ps._elements[i].customName == this.customName))
        {
            this._element = ps._elements[i];
            return true;
        }
    }
    return false;
};

Tw2RandomIntegerAttributeGenerator.prototype.Generate = function(position, velocity, index)
{
    for (var i = 0; i < this._element.dimension; ++i)
    {
        this._element.buffer[this._element.instanceStride * index + this._element.startOffset + i] = Math.floor(this.minRange[i] + Math.random() * (this.maxRange[i] - this.minRange[i]) + 0.5);
    }
};
