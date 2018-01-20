import {quat} from '../math';

/**
 * Tw2QuaternionSequencer
 * @property {string} name
 * @property {number} start
 * @property {quat} value
 * @property {Array} functions
 * @constructor
 */
export function Tw2QuaternionSequencer()
{
    this.name = '';
    this.start = 0;
    this.value = quat.create();
    this.functions = [];
}

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2QuaternionSequencer.prototype.GetLength = function ()
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
Tw2QuaternionSequencer.prototype.UpdateValue = function (time)
{
    this.GetValueAt(time, this.value);
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @param {quat} value
 * @returns {quat}
 * @prototype
 */
Tw2QuaternionSequencer.prototype.GetValueAt = function (time, value)
{
    quat.identity(value, value);
    var tempValue = Tw2QuaternionSequencer.scratch.quat_0;
    var functions = this.functions;
    for (var i = 0; i < functions.length; ++i)
    {
        functions[i].GetValueAt(time, tempValue);
        quat.multiply(value, value, tempValue);
    }
    return value;
};

/**
 * Scratch variables
 */
Tw2QuaternionSequencer.scratch = {
    quat_0: quat.create()
};
