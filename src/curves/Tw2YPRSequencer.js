function Tw2YPRSequencer()
{
    this.name = '';
    this.value = quat4.create([0, 0, 0, 1]);
    this.YawPitchRoll = vec3.create();
    this.YawCurve = null;
    this.PitchCurve = null;
    this.RollCurve = null;
}

Tw2YPRSequencer.prototype.GetLength = function () {
    var length = 0;
    if (this.YawCurve && ('GetLength' in this.YawCurve)) {
        length = this.YawCurve.GetLength();
    }
    if (this.PitchCurve && ('GetLength' in this.PitchCurve)) {
        length = Math.max(length, this.PitchCurve.GetLength());
    }
    if (this.RollCurve && ('GetLength' in this.RollCurve)) {
        length = Math.max(length, this.RollCurve.GetLength());
    }
    return length;
}

Tw2YPRSequencer.prototype.UpdateValue = function (t) 
{
    this.GetValueAt(t, this.value);
}

Tw2YPRSequencer.prototype.GetValueAt = function (t, value)
{
    if (this.YawCurve)
    {
        this.YawPitchRoll[0] = this.YawCurve.GetValueAt(t);
    }
    if (this.PitchCurve)
    {
        this.YawPitchRoll[1] = this.PitchCurve.GetValueAt(t);
    }
    if (this.RollCurve)
    {
        this.YawPitchRoll[2] = this.RollCurve.GetValueAt(t);
    }

    var sinYaw = Math.sin(this.YawPitchRoll[0] / 180 * Math.PI / 2.0);
    var cosYaw = Math.cos(this.YawPitchRoll[0] / 180 * Math.PI / 2.0);
    var sinPitch = Math.sin(this.YawPitchRoll[1] / 180 * Math.PI / 2.0);
    var cosPitch = Math.cos(this.YawPitchRoll[1] / 180 * Math.PI / 2.0);
    var sinRoll = Math.sin(this.YawPitchRoll[2] / 180 * Math.PI / 2.0);
    var cosRoll = Math.cos(this.YawPitchRoll[2] / 180 * Math.PI / 2.0);

    value[0] = sinYaw * cosPitch * sinRoll + cosYaw * sinPitch * cosRoll;
    value[1] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
    value[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
    value[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;

    return value;
}