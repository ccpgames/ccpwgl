import {quat} from '../../global';
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

    start = 0;
    value = quat.create();
    functions = [];


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

    /**
     * The sequencer's curve dimension
     * @type {number}
     */
    static inputDimension = 4;

    /**
     * The sequencer's dimension
     * @type {number}
     */
    static outputDimension = 4;

    /**
     * The sequencer's current value property
     * @type {string}
     */
    static valueProperty = 'value';

    /**
     * The sequencer's type
     * @type {number}
     */
    static curveType = Tw2CurveSequencer.Type.SEQUENCER;

    /**
     * The sequencer's curve array
     * @type {string}
     */
    static childArray = 'functions';

}
