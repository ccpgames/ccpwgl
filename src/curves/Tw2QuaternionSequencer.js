/**
 * Tw2QuaternionSequencer
 * @property {string} name
 * @property {number} start
 * @property {quat4} value
 * @property {Array} functions
 * @property {quat4} _tempValue
 * @constructor
 */
function Tw2QuaternionSequencer()
{
    this.name = '';
    this.start = 0;
    this.value = quat4.create();
    this.functions = [];
    this._tempValue = quat4.create();
}

/**
 * Gets curve length
 * @returns {number}
 * @prototype
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
 * @prototype
 */
Tw2QuaternionSequencer.prototype.UpdateValue = function(time)
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
Tw2QuaternionSequencer.prototype.GetValueAt = function(time, value)
{
    value[0] = 0;
    value[1] = 0;
    value[2] = 0;
    value[3] = 1;
    var tempValue = this._tempValue;
    var functions = this.functions;
    for (var i = 0; i < functions.length; ++i)
    {
        functions[i].GetValueAt(time, tempValue);
        quat4.multiply(value, tempValue);
    }
    return value;
};
