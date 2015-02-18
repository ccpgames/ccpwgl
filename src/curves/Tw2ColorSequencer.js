function Tw2ColorSequencer()
{
    this.name = '';
    this.start = 0;
    this.value = quat4.create();
    this.operator = 0;
    this.functions = [];
    this._tempValue = quat4.create();
}

Tw2ColorSequencer.prototype.GetLength = function () {
    var length = 0;
    for (var i = 0; i < this.functions.length; ++i) {
        if ('GetLength' in this.functions[i]) {
            length = Math.max(length, this.functions[i].GetLength());
        }
    }
    return length;
}

Tw2ColorSequencer.prototype.UpdateValue = function (t)
{
    this.GetValueAt(t, this.value);
}

Tw2ColorSequencer.prototype.GetValueAt = function (t, value)
{
    if (this.operator == 0)
    {
        value[0] = 1;
        value[1] = 1;
        value[2] = 1;
        value[3] = 1;
        var tempValue = this._tempValue;
        var functions = this.functions;
        for (var i = 0; i < functions.length; ++i)
        {
            functions[i].GetValueAt(t, tempValue);
            value[0] *= tempValue[0];
            value[1] *= tempValue[1];
            value[2] *= tempValue[2];
            value[3] *= tempValue[3];
        }
    }
    else
    {
        value[0] = 0;
        value[1] = 0;
        value[2] = 0;
        value[3] = 0;
        var tempValue = this._tempValue;
        var functions = this.functions;
        for (var i = 0; i < functions.length; ++i)
        {
            functions[i].GetValueAt(t, tempValue);
            value[0] += tempValue[0];
            value[1] += tempValue[1];
            value[2] += tempValue[2];
            value[3] += tempValue[3];
        }
    }
    return value;
}