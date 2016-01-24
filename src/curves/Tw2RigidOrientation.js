/**
 * Tw2Torque
 * @property {number} time
 * @property {quat4} rot0=[0,0,0,1]
 * @property {vec3} omega0
 * @property {vec3} torque
 * @constructor
 */
function Tw2Torque()
{
    this.time = 0;
    this.rot0 = quat4.create([0, 0, 0, 1]);
    this.omega0 = vec3.create();
    this.torque = vec3.create();
}


/**
 * Tw2RigidOrientation
 * @property {string} name
 * @property {number} I
 * @property {number} drag
 * @property {quat4} value=[0,0,0,1]
 * @property {number} start
 * @property {Array} states
 * @property {vec3} _tau
 * @property {quat4} _tauConverter
 * @constructor
 */
function Tw2RigidOrientation()
{
    this.name = '';
    this.I = 1;
    this.drag = 1;
    this.value = quat4.create([0, 0, 0, 1]);
    this.start = 0;
    this.states = [];
    this._tau = vec3.create();
    this._tauConverter = quat4.create();
}

/**
 * Updates a value at a specific time
 * @param {number} time
 * @prototype
 */
Tw2RigidOrientation.prototype.UpdateValue = function(time)
{
    this.GetValueAt(time, this.value);
};

/**
 * ExponentialDecay
 * @param v
 * @param a
 * @param m
 * @param k
 * @param t
 * @returns {number}
 * @prototype
 */
Tw2RigidOrientation.prototype.ExponentialDecay = function(v, a, m, k, t)
{
    return a * t / k + m * (v * k - a) / (k * k) * (1.0 - Math.pow(Math.E, -k * t / m));
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @param {quat4} value
 * @returns {quat4}
 * @prototype
 */
Tw2RigidOrientation.prototype.GetValueAt = function(time, value)
{
    if (this.states.length == 0 || time < 0 || time < this.states[0].time)
    {
        quat4.set(this.value, value);
        return value;
    }
    var key = 0;
    if (time >= this.states[this.states.length - 1].time)
    {
        key = this.states.length - 1;
    }
    else
    {
        for (; key + 1 < this.states.length; ++key)
        {
            if (time >= this.states[key].time && time < this.states[key + 1].time)
            {
                break;
            }
        }
    }
    time -= this.states[key].time;

    this._tau[0] = this.ExponentialDecay(this.states[key].omega0[0], this.states[key].torque[0], this.I, this.drag, time);
    this._tau[1] = this.ExponentialDecay(this.states[key].omega0[1], this.states[key].torque[1], this.I, this.drag, time);
    this._tau[2] = this.ExponentialDecay(this.states[key].omega0[2], this.states[key].torque[2], this.I, this.drag, time);

    vec3.set(this._tau, this._tauConverter);
    this._tauConverter[3] = 0;

    var norm = Math.sqrt(
        this._tauConverter[0] * this._tauConverter[0] +
        this._tauConverter[1] * this._tauConverter[1] +
        this._tauConverter[2] * this._tauConverter[2] +
        this._tauConverter[3] * this._tauConverter[3]);
    if (norm)
    {
        this._tauConverter[0] = Math.sin(norm) * this._tauConverter[0] / norm;
        this._tauConverter[1] = Math.sin(norm) * this._tauConverter[1] / norm;
        this._tauConverter[2] = Math.sin(norm) * this._tauConverter[2] / norm;
        this._tauConverter[3] = Math.cos(norm);
    }
    else
    {
        this._tauConverter[0] = 0.0;
        this._tauConverter[1] = 0.0;
        this._tauConverter[2] = 0.0;
        this._tauConverter[3] = 1.0;
    }
    quat4.multiply(this.states[key].rot0, this._tauConverter, value);
    return value;
};
