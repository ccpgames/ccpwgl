function Tw2EventKey()
{
    this.time = 0;
    this.value = '';
}

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

Tw2EventCurve.KeySort = function (a, b)
{
    if (a.time < b.time) return -1;
    if (a.time > b.time) return 1;
    return 0; 
}

Tw2EventCurve.prototype.Initialize = function ()
{
    this.keys.sort(Tw2EventCurve.KeySort);
    this._length = 0;
    if (this.keys.length)
    {
        this._length = this.keys[this.keys.length - 1].time;
    }
}

Tw2EventCurve.prototype.GetLength = function () {
    return this._length;
}

Tw2EventCurve.prototype.UpdateValue = function (t)
{
    if (this._length <= 0)
    {
        return;
    }
    var before = this._time;
    this._time = t;
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
}
