/**
 * Tw2EventKey
 * @property {Number} time
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
 * @property {string} value
 * @property {Array.<Tw2EventKey>} keys
 * @property {Number} extrapolation
 * @property {Number} _length
 * @property {Number} _time
 * @property {Number} _currentKey
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
 * @param {Tw2EventKey} a
 * @param {Tw2EventKey} b
 * @returns {Number}
 */
Tw2EventCurve.Compare = function(a, b)
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
 */
Tw2EventCurve.prototype.Initialize = function()
{
    this.keys.sort(Tw2EventCurve.Compare);
    this._length = 0;
    if (this.keys.length)
    {
        this._length = this.keys[this.keys.length - 1].time;
    }
};

/**
 * Gets curve length
 * @returns {Number}
 */
Tw2EventCurve.prototype.GetLength = function()
{
    return this._length;
};

/**
 * Updates a value at a specific time
 * @param {Number} time
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
