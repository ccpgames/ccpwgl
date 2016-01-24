/**
 * Tw2MayaVector3Curve
 * @property {number} xIndex
 * @property {number} yIndex
 * @property {number} zIndex
 * @property {null|Tw2MayaAnimationEngine} animationEngine
 * @property {string} name
 * @property {vec3} value
 * @constructor
 */
function Tw2MayaVector3Curve()
{
    this.xIndex = -1;
    this.yIndex = -1;
    this.zIndex = -1;
    this.animationEngine = null;
    this.name = '';
    this.value = vec3.create();
}

/**
 * Initializes the Curve
 * @returns {boolean}
 * @prototype
 */
Tw2MayaVector3Curve.prototype.Initialize = function()
{
    this.ComputeLength();
    return true;
};

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2MayaVector3Curve.prototype.GetLength = function()
{
    return this.length;
};

/**
 * Updates a value at a specific time
 * @param {number} time
 * @prototype
 */
Tw2MayaVector3Curve.prototype.UpdateValue = function(time)
{
    if (this.animationEngine)
    {
        if (this.xIndex)
        {
            this.value[0] = this.animationEngine.Evaluate(this.xIndex, time);
        }
        if (this.yIndex)
        {
            if (this.yIndex == this.xIndex)
            {
                this.value[1] = this.value[0];
            }
            else
            {
                this.value[1] = this.animationEngine.Evaluate(this.yIndex, time);
            }
        }
        if (this.zIndex)
        {
            if (this.zIndex == this.xIndex)
            {
                this.value[2] = this.value[0];
            }
            else
            {
                this.value[2] = this.animationEngine.Evaluate(this.zIndex, time);
            }
        }
    }
};

/**
 * Computes curve Length
 * @prototype
 */
Tw2MayaVector3Curve.prototype.ComputeLength = function()
{
    if (!this.animationEngine || this.animationEngine.GetNumberOfCurves() == 0)
    {
        return;
    }
    this.length = 0;
    if (this.xIndex >= 0)
    {
        this.length = this.animationEngine.GetLength(this.xIndex);
    }
    if (this.yIndex >= 0)
    {
        this.length = Math.max(this.length, this.animationEngine.GetLength(this.yIndex));
    }
    if (this.zIndex >= 0)
    {
        this.length = Math.max(this.length, this.animationEngine.GetLength(this.zIndex));
    }
};
