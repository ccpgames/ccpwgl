function Tw2RandomConstantCurve()
{
    this.name = '';
    this.value = 0;
    this.min = 0;
    this.max = 1;
    this.hold = true;
}

Tw2RandomConstantCurve.prototype.UpdateValue = function (t)
{
    this.value = this.GetValueAt(t);
}

Tw2RandomConstantCurve.prototype.GetValueAt = function (t, value)
{
    if (!this.hold)
    {
        this.value = this.min + (this.max - this.min) * Math.random();
    }
    return this.value;
}