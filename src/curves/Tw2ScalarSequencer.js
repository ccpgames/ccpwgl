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

Tw2ScalarSequencer.prototype.GetLength = function () {
    var length = 0;
    for (var i = 0; i < this.functions.length; ++i) {
        if ('GetLength' in this.functions[i]) {
            length = Math.max(length, this.functions[i].GetLength());
        }
    }
    return length;
}

Tw2ScalarSequencer.prototype.UpdateValue = function (t)
{
    this.value = this.GetValueAt(t);
}

Tw2ScalarSequencer.prototype.GetValueAt = function (t)
{
    if (this.operator == 0)
    {
        var ret = 1;
        for (var i = 0; i < this.functions.length; ++i)
        {
            var v = this.functions[i].GetValueAt(t);
            if (this.clamping)
            {
                v = Math.min(Math.max(v, this.inMinClamp), this.inMaxClamp);
            }
            ret *= v;
        }
    }
    else
    {
        var ret = 0;
        for (var i = 0; i < this.functions.length; ++i)
        {
            var v = this.functions[i].GetValueAt(t);
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
}
