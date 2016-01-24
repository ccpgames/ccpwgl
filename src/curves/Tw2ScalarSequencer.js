/**
 * Tw2ScalarSequencer
 * @property {string} name
 * @property {number} value
 * @property {number} operator
 * @property {Array} functions
 * @property {number} inMinClamp
 * @property {number} inMaxClamp
 * @property {number} outMinClamp
 * @property {number} outMaxClamp
 * @property {boolean} clamping
 * @constructor
 */
function Tw2ScalarSequencer()
{
    this.name = '';
    this.value = 0;
    this.operator = 0;
    this.functions = [];
    this.inMinClamp = 0;
    this.inMaxClamp = 1;
    this.outMinClamp = 0;
    this.outMaxClamp = 1;
    this.clamping = false;
}

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2ScalarSequencer.prototype.GetLength = function()
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
Tw2ScalarSequencer.prototype.UpdateValue = function(time)
{
    this.value = this.GetValueAt(time);
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @returns {number}
 * @prototype
 */
Tw2ScalarSequencer.prototype.GetValueAt = function(time)
{
    var ret, i, v;

    if (this.operator == 0)
    {
        ret = 1;
        for (i = 0; i < this.functions.length; ++i)
        {
            v = this.functions[i].GetValueAt(time);
            if (this.clamping)
            {
                v = Math.min(Math.max(v, this.inMinClamp), this.inMaxClamp);
            }
            ret *= v;
        }
    }
    else
    {
        ret = 0;
        for (i = 0; i < this.functions.length; ++i)
        {
            v = this.functions[i].GetValueAt(time);
            if (this.clamping)
            {
                v = Math.min(Math.max(v, this.inMinClamp), this.inMaxClamp);
            }
            ret += v;
        }
    }
    if (this.clamping)
    {
        ret = Math.min(Math.max(ret, this.outMinClamp), this.outMaxClamp);
    }
    return ret;
};
