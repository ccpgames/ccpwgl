/**
 * Tw2EulerRotation
 * @property {string} name
 * @property {*} [yawCurve]
 * @property {*} [pitchCurve]
 * @property {*} [rollCurve]
 * @property {quat} currentValue=[0,0,0,1]
 * @constructor
 */
function Tw2EulerRotation()
{
    this.name = '';
    this.yawCurve = null;
    this.pitchCurve = null;
    this.rollCurve = null;
    this.currentValue = quat.create([0, 0, 0, 1]);
}

/**
 * Updates a value at a specific time
 * @param {number} time
 * @prototype
 */
Tw2EulerRotation.prototype.UpdateValue = function(time)
{
    this.GetValueAt(time, this.currentValue);
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @param {quat} value
 * @returns {quat}
 * @prototype
 */
Tw2EulerRotation.prototype.GetValueAt = function(time, value)
{
    var yaw = this.yawCurve ? this.yawCurve.GetValueAt(time) : 0.0;
    var pitch = this.pitchCurve ? this.pitchCurve.GetValueAt(time) : 0.0;
    var roll = this.rollCurve ? this.rollCurve.GetValueAt(time) : 0.0;

    var sinYaw = Math.sin(yaw / 2.0);
    var cosYaw = Math.cos(yaw / 2.0);
    var sinPitch = Math.sin(pitch / 2.0);
    var cosPitch = Math.cos(pitch / 2.0);
    var sinRoll = Math.sin(roll / 2.0);
    var cosRoll = Math.cos(roll / 2.0);

    value[0] = sinYaw * cosPitch * sinRoll + cosYaw * sinPitch * cosRoll;
    value[1] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
    value[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
    value[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;

    return value;
};

/**
 * Gets curve length
 * @returns {number}
 * @prototype
 */
Tw2EulerRotation.prototype.GetLength = function()
{
    var length = 0;
    if (this.yawCurve && ('GetLength' in this.yawCurve))
    {
        length = this.yawCurve.GetLength();
    }
    if (this.pitchCurve && ('GetLength' in this.pitchCurve))
    {
        length = Math.max(length, this.pitchCurve.GetLength());
    }
    if (this.rollCurve && ('GetLength' in this.rollCurve))
    {
        length = Math.max(length, this.rollCurve.GetLength());
    }
    return length;
};
