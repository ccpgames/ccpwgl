import {quat} from '../../global';
import {Tw2CurveSequencer} from './Tw2CurveSequencer';

/**
 * Tw2EulerRotation
 *
 * @property {string} name
 * @property {Tw2Curve} [yawCurve]
 * @property {Tw2Curve} [pitchCurve]
 * @property {Tw2Curve} [rollCurve]
 * @property {quat} currentValue=[0,0,0,1]
 * @class
 */
export class Tw2EulerRotation extends Tw2CurveSequencer
{
    constructor()
    {
        super();
        this.yawCurve = null;
        this.pitchCurve = null;
        this.rollCurve = null;
        this.currentValue = quat.create();
    }

    /**
     * Sorts the sequencer
     */
    Sort()
    {
        Tw2CurveSequencer.Sort2(this);
    }

    /**
     * Gets sequencer length
     * @returns {number}
     */
    GetLength()
    {
        let len = 0;
        if (this.yawCurve && ('GetLength' in this.yawCurve)) len = this.yawCurve.GetLength();
        if (this.pitchCurve && ('GetLength' in this.pitchCurve)) len = Math.max(len, this.pitchCurve.GetLength());
        if (this.rollCurve && ('GetLength' in this.rollCurve)) len = Math.max(len, this.rollCurve.GetLength());
        return len;
    }

    /**
     * Updates the current value at a specific time
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.currentValue);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {quat} value
     * @returns {quat}
     */
    GetValueAt(time, value)
    {
        const
            yaw = this.yawCurve ? this.yawCurve.GetValueAt(time) : 0.0,
            pitch = this.pitchCurve ? this.pitchCurve.GetValueAt(time) : 0.0,
            roll = this.rollCurve ? this.rollCurve.GetValueAt(time) : 0.0;

        const
            sinYaw = Math.sin(yaw / 2.0),
            cosYaw = Math.cos(yaw / 2.0),
            sinPitch = Math.sin(pitch / 2.0),
            cosPitch = Math.cos(pitch / 2.0),
            sinRoll = Math.sin(roll / 2.0),
            cosRoll = Math.cos(roll / 2.0);

        value[0] = sinYaw * cosPitch * sinRoll + cosYaw * sinPitch * cosRoll;
        value[1] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
        value[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
        value[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;

        return value;
    }
}

/**
 * The sequencer's curve dimension
 * @type {number}
 */
Tw2EulerRotation.inputDimension = 1;

/**
 * The sequencer's dimension
 * @type {number}
 */
Tw2EulerRotation.outputDimension = 3;

/**
 * The sequencer's current value property
 * @type {string}
 */
Tw2EulerRotation.valueProperty = 'currentValue';

/**
 * The sequencer's type
 * @type {number}
 */
Tw2EulerRotation.curveType = Tw2CurveSequencer.Type.SEQUENCER2;

/**
 * The sequencer's curve property names
 * @type {string[]}
 */
Tw2EulerRotation.childProperties = ['yawCurve', 'pitchCurve', 'rollCurve'];