function Tw2QuaternionSequencer()
{
    this.name = '';
    this.start = 0;
    this.value = quat4.create();
    this.functions = [];
    this._tempValue = quat4.create();
}

Tw2QuaternionSequencer.prototype.GetLength = function () {
    var length = 0;
    for (var i = 0; i < this.functions.length; ++i) {
        if ('GetLength' in this.functions[i]) {
            length = Math.max(length, this.functions[i].GetLength());
        }
    }
    return length;
}

Tw2QuaternionSequencer.prototype.UpdateValue = function (t)
{
    this.GetValueAt(t, this.value);
}

Tw2QuaternionSequencer.prototype.GetValueAt = function (t, value)
{
    value[0] = 0;
    value[1] = 0;
    value[2] = 0;
    value[3] = 1;
    var tempValue = this._tempValue;
    var functions = this.functions;
    for (var i = 0; i < functions.length; ++i)
    {
        functions[i].GetValueAt(t, tempValue);
        quat4.multiply(value, tempValue);
    }
    return value;
}