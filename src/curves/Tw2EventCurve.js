/**
 * Tw2EventKey
 * @property {number} time
 * @property value
 * @constructor
 */
function Tw2EventKey()
{
    this.time = 0;
    this.value = '';
}


/**
 * Tw2EventCurve
 * @property {string} name
 * @property value
 * @property {Array.<Tw2EventKey>} keys
 * @property {number} extrapolation
 * @property {number} _length
 * @property {number} _time
 * @property {number} _currentKey
 * @constructor
 */
function Tw2EventCurve()
{
    this.name = '';
    this.value = '';
    this.keys = [];
    this.extrapolation = 0;
    this._length = 0;
    this._time = 0;
    this._currentKey = 0;
}

/**
 * Compares two curve keys' time properties
 * TODO: This function is called 'Compare' in other Tw2Curves, check to see if it can be refactored.
 * @param {Tw2EventKey} a
 * @param {Tw2EventKey} b
 * @returns {number}
 * @method
 */
Tw2EventCurve.KeySort = function(a, b)
{
    if (a.time < b.time)
    {
        return -1;
    }
    if (a.time > b.time)
    {
        return 1;
    }
    return 0;
};

/**
 * Initializes the Curve
 * @prototype
 */
Tw2EventCurve.prototype.Initialize = function()
{
    this.keys.sort(Tw2EventCurve.KeySort);
    this._length = 0;
    if (this.keys.length)
    {
        this._length = this.keys[this.keys.length - 1].time;
    }
};

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2EventCurve.prototype.GetLength = function()
{
    return this._length;
};

/**
 * Updates a value at a specific time
 * @param {number} time
 * @prototype
 */
Tw2EventCurve.prototype.UpdateValue = function(time)
{
    if (this._length <= 0)
    {
        return;
    }
    var before = this._time;
    this._time = time;
    if (this._time < before)
    {
        this._currentKey = 0;
    }
    if (this.extrapolation == 3)
    {
        var now = this._time % this._length;
        if (now < before)
        {
            this._currentKey = 0;
        }
        this._time = now;
    }
    while (this._currentKey < this.keys.length && this._time >= this.keys[this._currentKey].time)
    {
        this.value = this.keys[this._currentKey].value;
        ++this._currentKey;
    }
};
