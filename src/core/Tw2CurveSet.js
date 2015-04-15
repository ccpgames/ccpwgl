function Tw2CurveSet()
{
    this.name = '';
    this.curves = [];
    this.bindings = [];
    this.scale = 1;
    this.playOnLoad = true;
    this.isPlaying = false;
    this.scaledTime = 0;
}

Tw2CurveSet.prototype.Initialize = function ()
{
    if (this.playOnLoad)
    {
        this.Play();
    }
}

Tw2CurveSet.prototype.Play = function () {
    this.isPlaying = true;
    this.scaledTime = 0;
}

Tw2CurveSet.prototype.PlayFrom = function (time) {
    this.isPlaying = true;
    this.scaledTime = time;
}

Tw2CurveSet.prototype.Stop = function ()
{
    this.isPlaying = false;
}

Tw2CurveSet.prototype.Update = function (dt)
{
    if (this.isPlaying)
    {
        this.scaledTime += dt * this.scale;
        var scaledTime = this.scaledTime;
        var curves = this.curves;
        for (var i = 0; i < curves.length; ++i)
        {
            curves[i].UpdateValue(scaledTime);
        }
        var bindings = this.bindings;
        for (var i = 0; i < bindings.length; ++i)
        {
            bindings[i].CopyValue();
        }
    }
}

Tw2CurveSet.prototype.GetMaxCurveDuration = function () {
    var length = 0;
    for (var i = 0; i < this.curves.length; ++i) {
        if ('GetLength' in this.curves[i]) {
            length = Math.max(length, this.curves[i].GetLength());
        }
    }
    return length;
}