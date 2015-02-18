function Tw2RGBAScalarSequencer()
{
    this.value = quat4.create();
    this.RedCurve = null;
    this.GreenCurve = null;
    this.BlueCurve = null;
    this.AlphaCurve = null;
}

Tw2RGBAScalarSequencer.prototype.GetLength = function () {
    var length = 0;
    if (this.RedCurve && ('GetLength' in this.RedCurve)) {
        length = this.RedCurve.GetLength();
    }
    if (this.GreenCurve && ('GetLength' in this.GreenCurve)) {
        length = Math.max(length, this.GreenCurve.GetLength());
    }
    if (this.BlueCurve && ('GetLength' in this.BlueCurve)) {
        length = Math.max(length, this.BlueCurve.GetLength());
    }
    if (this.AlphaCurve && ('GetLength' in this.AlphaCurve)) {
        length = Math.max(length, this.AlphaCurve.GetLength());
    }
    return length;
}

Tw2RGBAScalarSequencer.prototype.UpdateValue = function (t)
{
    this.GetValueAt(t, this.value);
}

Tw2RGBAScalarSequencer.prototype.GetValueAt = function (t, value)
{
    if (this.RedCurve)
    {
        value[0] = this.RedCurve.GetValueAt(t)
    }
    else
    {
        value[0] = 0;
    }
    if (this.GreenCurve)
    {
        value[1] = this.GreenCurve.GetValueAt(t)
    }
    else
    {
        value[1] = 0;
    }
    if (this.BlueCurve)
    {
        value[2] = this.BlueCurve.GetValueAt(t)
    }
    else
    {
        value[2] = 0;
    }
    if (this.AlphaCurve)
    {
        value[3] = this.AlphaCurve.GetValueAt(t)
    }
    else
    {
        value[3] = 0;
    }
    return value;
}