import {quat} from '../../math';
import {Tw2CurveSequencer} from './Tw2CurveSequencer';

/**
 * Tw2QuaternionSequencer
 *
 * @property {string} name
 * @property {number} start
 * @property {quat} value
 * @property {Array<Tw2Curve>} functions
 * @class
 */
export class Tw2QuaternionSequencer extends Tw2CurveSequencer
{
    constructor()
    {
        super();
        this.start = 0;
        this.value = quat.create();
        this.functions = [];
    }

    /**
     * Sorts the sequencer
     */
    Sort()
    {
        Tw2CurveSequencer.Sort(this);
    }

    /**
     * Gets sequencer length
     * @returns {number}
     */
    GetLength()
    {
        let len = 0;
        for (let i = 0; i < this.functions.length; ++i)
        {
            if ('GetLength' in this.functions[i])
            {
                len = Math.max(len, this.functions[i].GetLength());
            }
        }
        return len;
    }

    /**
     * Updates a value at a specific time
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.value);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {quat} value
     * @returns {quat}
     */
    GetValueAt(time, value)
    {
        quat.identity(value);
        const quat_0 = Tw2CurveSequencer.global.quat_0;
        for (let i = 0; i < this.functions.length; ++i)
        {
            this.functions[i].GetValueAt(time, quat_0);
            quat.multiply(value, value, quat_0);
        }
        return value;
    }
}

/**
 * The sequencer's curve dimension
 * @type {number}
 */
Tw2QuaternionSequencer.inputDimension = 4;

/**
 * The sequencer's dimension
 * @type {number}
 */
Tw2QuaternionSequencer.outputDimension = 4;

/**
 * The sequencer's current value property
 * @type {string}
 */
Tw2QuaternionSequencer.valueProperty = 'value';

/**
 * The sequencer's type
 * @type {number}
 */
Tw2QuaternionSequencer.curveType = Tw2CurveSequencer.Type.SEQUENCER;

/**
 * The sequencer's curve array
 * @type {string}
 */
Tw2QuaternionSequencer.childArray = 'functions';
