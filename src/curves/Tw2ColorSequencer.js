/**
 * Tw2ColorSequencer
 * @property {string} name
 * @property {number} start
 * @property {vec4} value
 * @property {number} operator
 * @property {Array} functions
 * @property {vec4} _tempValue
 * @constructor
 */
function Tw2ColorSequencer()
{
    this.name = '';
    this.start = 0;
    this.value = vec4.create();
    this.operator = 0;
    this.functions = [];
    this._tempValue = vec4.create();
}

/**
 * Gets curve length
 * @returns {number}
 */
Tw2ColorSequencer.prototype.GetLength = function()
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
Tw2ColorSequencer.prototype.UpdateValue = function(time)
{
    this.GetValueAt(time, this.value);
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @param {vec4} value
 * @returns {vec4}
 */
Tw2ColorSequencer.prototype.GetValueAt = function(time, value)
{
    var tempValue, functions, i;

    if (this.operator == 0)
    {
        vec4.fill(value, 1);
        tempValue = this._tempValue;
        functions = this.functions;
        for (i = 0; i < functions.length; ++i)
        {
            functions[i].GetValueAt(time, tempValue);
            vec4.multiply(value, value, tempValue);
        }
    }
    else
    {
        vec4.fill(value, 0);
        tempValue = this._tempValue;
        functions = this.functions;
        for (i = 0; i < functions.length; ++i)
        {
            functions[i].GetValueAt(time, tempValue);
            vec4.add(value, value, tempValue);
        }
    }
    return value;
};
