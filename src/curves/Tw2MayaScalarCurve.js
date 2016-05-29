/**
 * Tw2MayaScalarCurve
 * @property {Number} index
 * @property {null|Tw2MayaAnimationEngine} animationEngine
 * @property {string} name
 * @property {Number} value
 * @property {Number} length
 * @constructor
 */
function Tw2MayaScalarCurve()
{
    this.index = -1;
    this.animationEngine = null;
    this.name = '';
    this.value = 0;
    this.length = 0;
}

/**
 * Initializes the Curve
 * @returns {Boolean}
 */
Tw2MayaScalarCurve.prototype.Initialize = function()
{
    this.ComputeLength();
    return true;
};

/**
 * Gets curve length
 * @returns {Number}
 */
Tw2MayaScalarCurve.prototype.GetLength = function()
{
    return this.length;
};

/**
 * Updates a value at a specific time
 * @param {Number} time
 */
Tw2MayaScalarCurve.prototype.UpdateValue = function(time)
{
    if (this.animationEngine)
    {
        this.value = this.animationEngine.Evaluate(this.index, time);
    }
};

/**
 * Computes curve Length
 */
Tw2MayaScalarCurve.prototype.ComputeLength = function()
{
    if (!this.animationEngine || this.animationEngine.GetNumberOfCurves() == 0)
    {
        return;
    }
    if (this.index >= 0)
    {
        this.length = this.animationEngine.GetLength(this.index);
    }
};
