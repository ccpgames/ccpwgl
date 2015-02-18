function Tw2SineCurve()
{
    this.name = '';
    this.value = 0;
    this.offset = 0;
    this.scale = 1;
    this.speed = 1;
}

Tw2SineCurve.prototype.UpdateValue = function (t) 
{
    this.value = this.GetValueAt(t);
}

Tw2SineCurve.prototype.GetValueAt = function (t)
{
    return Math.sin(t * Math.pi * 2 * this.speed) * this.scale + this.offset;
}
