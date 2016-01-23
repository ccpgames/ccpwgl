/**
 * Tw2XYZScalarSequencer
 * @property {string} name
 * @property {vec3} value
 * @property XCurve
 * @property YCurve
 * @property ZCurve
 * @constructor
 */
function Tw2XYZScalarSequencer()
{
    this.name = '';
    this.value = vec3.create();
    this.XCurve = null;
    this.YCurve = null;
    this.ZCurve = null;
}

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2XYZScalarSequencer.prototype.GetLength = function()
{
    var length = 0;
    if (this.XCurve && ('GetLength' in this.XCurve))
    {
        length = this.XCurve.GetLength();
    }
    if (this.YCurve && ('GetLength' in this.YCurve))
    {
        length = Math.max(length, this.YCurve.GetLength());
    }
    if (this.ZCurve && ('GetLength' in this.ZCurve))
    {
        length = Math.max(length, this.ZCurve.GetLength());
    }
    return length;
};

/**
 * Updates a value at a specific time
 * @param {number} time
 * @prototype
 */
Tw2XYZScalarSequencer.prototype.UpdateValue = function(time)
{
    this.GetValueAt(time, this.value);
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @param {vec3} value
 * @returns {vec3}
 * @prototype
 */
Tw2XYZScalarSequencer.prototype.GetValueAt = function(time, value)
{
    if (this.XCurve)
    {
        value[0] = this.XCurve.GetValueAt(time);
    }
    else
    {
        value[0] = 0;
    }
    if (this.YCurve)
    {
        value[1] = this.YCurve.GetValueAt(time);
    }
    else
    {
        value[1] = 0;
    }
    if (this.ZCurve)
    {
        value[2] = this.ZCurve.GetValueAt(time);
    }
    else
    {
        value[2] = 0;
    }
    return value;
};
