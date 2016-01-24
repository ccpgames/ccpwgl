/**
 * Tw2RGBAScalarSequencer
 * @property {quat4} value
 * @property {null|Tw2Curve} RedCurve
 * @property {null|Tw2Curve} GreenCurve
 * @property {null|Tw2Curve} BlueCurve
 * @property {null|Tw2Curve} AlphaCurve
 * @constructor
 */
function Tw2RGBAScalarSequencer()
{
    this.value = quat4.create();
    this.RedCurve = null;
    this.GreenCurve = null;
    this.BlueCurve = null;
    this.AlphaCurve = null;
}

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2RGBAScalarSequencer.prototype.GetLength = function()
{
    var length = 0;
    if (this.RedCurve && ('GetLength' in this.RedCurve))
    {
        length = this.RedCurve.GetLength();
    }
    if (this.GreenCurve && ('GetLength' in this.GreenCurve))
    {
        length = Math.max(length, this.GreenCurve.GetLength());
    }
    if (this.BlueCurve && ('GetLength' in this.BlueCurve))
    {
        length = Math.max(length, this.BlueCurve.GetLength());
    }
    if (this.AlphaCurve && ('GetLength' in this.AlphaCurve))
    {
        length = Math.max(length, this.AlphaCurve.GetLength());
    }
    return length;
};

/**
 * Updates a value at a specific time
 * @param {number} time
 * @prototype
 */
Tw2RGBAScalarSequencer.prototype.UpdateValue = function(time)
{
    this.GetValueAt(time, this.value);
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @param {quat4} value
 * @returns {quat4}
 * @prototype
 */
Tw2RGBAScalarSequencer.prototype.GetValueAt = function(time, value)
{
    if (this.RedCurve)
    {
        value[0] = this.RedCurve.GetValueAt(time)
    }
    else
    {
        value[0] = 0;
    }
    if (this.GreenCurve)
    {
        value[1] = this.GreenCurve.GetValueAt(time)
    }
    else
    {
        value[1] = 0;
    }
    if (this.BlueCurve)
    {
        value[2] = this.BlueCurve.GetValueAt(time)
    }
    else
    {
        value[2] = 0;
    }
    if (this.AlphaCurve)
    {
        value[3] = this.AlphaCurve.GetValueAt(time)
    }
    else
    {
        value[3] = 0;
    }
    return value;
};
