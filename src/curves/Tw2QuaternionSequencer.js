/**
 * Tw2QuaternionSequencer
 * @property {string} name
 * @property {number} start
 * @property {quat} value
 * @property {Array} functions
 * @property {quat} _tempValue
 * @constructor
 */
function Tw2QuaternionSequencer()
{
    this.name = '';
    this.start = 0;
    this.value = quat.zero();
    this.functions = [];
    this._tempValue = quat.zero();
}

/**
 * Gets curve length
 * @returns {number}
 */
Tw2QuaternionSequencer.prototype.GetLength = function()
{
    var length = 0;
    for (var i = 0; i < this.functions.length; ++i)
    {
        if ('GetLength' in this.functions[i])
        {
            length = Math.max(length, this.functions[i].GetLength());
        }
    }
    return length;
};

/**
 * Updates a value at a specific time
 * @param {number} time
 */
Tw2QuaternionSequencer.prototype.UpdateValue = function(time)
{
    this.GetValueAt(time, this.value);
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @param {quat} value
 * @returns {quat}
 */
Tw2QuaternionSequencer.prototype.GetValueAt = function(time, value)
{
    quat.identity(value);
    var tempValue = this._tempValue;
    var functions = this.functions;
    for (var i = 0; i < functions.length; ++i)
    {
        functions[i].GetValueAt(time, tempValue);
        quat.multiply(value, value, tempValue);
    }
    return value;
};
