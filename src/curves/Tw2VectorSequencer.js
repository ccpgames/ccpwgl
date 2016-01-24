/**
 * Tw2VectorSequencer
 * @property {string} name
 * @property {number} start
 * @property {vec3} value
 * @property {number} operator
 * @property {Array} functions
 * @property {vec3} _tempValue
 * @constructor
 */
function Tw2VectorSequencer()
{
    this.name = '';
    this.start = 0;
    this.value = vec3.create();
    this.operator = 0;
    this.functions = [];
    this._tempValue = vec3.create();
}

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2VectorSequencer.prototype.GetLength = function()
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
Tw2VectorSequencer.prototype.UpdateValue = function(time)
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
Tw2VectorSequencer.prototype.GetValueAt = function(time, value)
{
    var tempValue, functions, i;

    if (this.operator == 0)
    {
        value[0] = 1;
        value[1] = 1;
        value[2] = 1;
        tempValue = this._tempValue;
        functions = this.functions;
        for (i = 0; i < functions.length; ++i)
        {
            functions[i].GetValueAt(time, tempValue);
            value[0] *= tempValue[0];
            value[1] *= tempValue[1];
            value[2] *= tempValue[2];
        }
    }
    else
    {
        value[0] = 0;
        value[1] = 0;
        value[2] = 0;
        tempValue = this._tempValue;
        functions = this.functions;
        for (i = 0; i < functions.length; ++i)
        {
            functions[i].GetValueAt(time, tempValue);
            value[0] += tempValue[0];
            value[1] += tempValue[1];
            value[2] += tempValue[2];
        }
    }
    return value;
};
