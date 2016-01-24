/**
 * Tw2RandomUniformAttributeGenerator
 * @property {number} elementType
 * @property {string} customName
 * @property {quat4} minRange
 * @property {quat4} maxRange
 * @property _element
 * @constructor
 */
function Tw2RandomUniformAttributeGenerator()
{
    this.elementType = Tw2ParticleElementDeclaration.CUSTOM;
    this.customName = '';
    this.minRange = quat4.create();
    this.maxRange = quat4.create();
    this._element = null;
}

/**
 * Bind
 * @param ps
 * @returns {boolean}
 * @prototype
 */
Tw2RandomUniformAttributeGenerator.prototype.Bind = function(ps)
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

/**
 * Generate
 * @param position
 * @param velocity
 * @param index
 * @prototype
 */
Tw2RandomUniformAttributeGenerator.prototype.Generate = function(position, velocity, index)
{
    for (var i = 0; i < this._element.dimension; ++i)
    {
        this._element.buffer[this._element.instanceStride * index + this._element.startOffset + i] = this.minRange[i] + Math.random() * (this.maxRange[i] - this.minRange[i]);
    }
};
