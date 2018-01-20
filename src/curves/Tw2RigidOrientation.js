import {vec3, quat} from '../math';

/**
 * Tw2Torque
 * @property {number} time
 * @property {quat} rot0
 * @property {vec3} omega0
 * @property {vec3} torque
 * @constructor
 */
export function Tw2Torque()
{
    this.time = 0;
    this.rot0 = quat.create();
    this.omega0 = vec3.create();
    this.torque = vec3.create();
}


/**
 * Tw2RigidOrientation
 * @property {string} name
 * @property {number} I
 * @property {number} drag
 * @property {quat} value
 * @property {number} start
 * @property {Array} states
 * @constructor
 */
export function Tw2RigidOrientation()
{
    this.name = '';
    this.I = 1;
    this.drag = 1;
    this.value = quat.create();
    this.start = 0;
    this.states = [];
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
Tw2RigidOrientation.ExponentialDecay = function(v, a, m, k, t)
{
    return a * t / k + m * (v * k - a) / (k * k) * (1.0 - Math.pow(Math.E, -k * t / m));
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @param {quat} value
 * @returns {quat}
 * @prototype
 */
Tw2RigidOrientation.prototype.GetValueAt = function(time, value)
{
    var tau = Tw2RigidOrientation.scratch.vec3_0,
        tauConverter = Tw2RigidOrientation.scratch.quat_0;

    if (this.states.length === 0 || time < 0 || time < this.states[0].time)
    {
        quat.copy(value, this.value);
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

    tau[0] = Tw2RigidOrientation.ExponentialDecay(this.states[key].omega0[0], this.states[key].torque[0], this.I, this.drag, time);
    tau[1] = Tw2RigidOrientation.ExponentialDecay(this.states[key].omega0[1], this.states[key].torque[1], this.I, this.drag, time);
    tau[2] = Tw2RigidOrientation.ExponentialDecay(this.states[key].omega0[2], this.states[key].torque[2], this.I, this.drag, time);

    tauConverter[0] = tau[0];
    tauConverter[1] = tau[1];
    tauConverter[2] = tau[2];
    tauConverter[3] = 0;

    var norm = Math.sqrt(
        tauConverter[0] * tauConverter[0] +
        tauConverter[1] * tauConverter[1] +
        tauConverter[2] * tauConverter[2] +
        tauConverter[3] * tauConverter[3]);
    if (norm)
    {
        tauConverter[0] = Math.sin(norm) * tauConverter[0] / norm;
        tauConverter[1] = Math.sin(norm) * tauConverter[1] / norm;
        tauConverter[2] = Math.sin(norm) * tauConverter[2] / norm;
        tauConverter[3] = Math.cos(norm);
    }
    else
    {
        tauConverter[0] = 0.0;
        tauConverter[1] = 0.0;
        tauConverter[2] = 0.0;
        tauConverter[3] = 1.0;
    }
    quat.multiply(value, this.states[key].rot0, tauConverter);
    return value;
};

/**
 * Scratch variables
 */
Tw2RigidOrientation.scratch = {
    vec3_0: vec3.create(),
    quat_0: quat.create()
};
