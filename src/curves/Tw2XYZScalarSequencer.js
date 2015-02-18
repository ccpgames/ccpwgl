function Tw2XYZScalarSequencer()
{
    this.name = '';
    this.value = vec3.create();
    this.XCurve = null;
    this.YCurve = null;
    this.ZCurve = null;
}

Tw2XYZScalarSequencer.prototype.GetLength = function () {
    var length = 0;
    if (this.XCurve && ('GetLength' in this.XCurve)) {
        length = this.XCurve.GetLength();
    }
    if (this.YCurve && ('GetLength' in this.YCurve)) {
        length = Math.max(length, this.YCurve.GetLength());
    }
    if (this.ZCurve && ('GetLength' in this.ZCurve)) {
        length = Math.max(length, this.ZCurve.GetLength());
    }
    return length;
}

Tw2XYZScalarSequencer.prototype.UpdateValue = function (t) 
{
    this.GetValueAt(t, this.value);
}

Tw2XYZScalarSequencer.prototype.GetValueAt = function (t, value)
{
    if (this.XCurve)
    {
        value[0] = this.XCurve.GetValueAt(t);
    }
    else
    {
        value[0] = 0;
    }
    if (this.YCurve)
    {
        value[1] = this.YCurve.GetValueAt(t);
    }
    else
    {
        value[1] = 0;
    }
    if (this.ZCurve)
    {
        value[2] = this.ZCurve.GetValueAt(t);
    }
    else
    {
        value[2] = 0;
    }
    return value;
}