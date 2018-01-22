import {vec4} from '../../math';
import {Tw2CurveSequencer} from './Tw2CurveSequencer';

/**
 * Tw2ColorSequencer
 *
 * @property {number} start
 * @property {vec4} value
 * @property {number} operator
 * @property {Array<Tw2Curve>} functions
 * @class
 */
export class Tw2ColorSequencer extends Tw2CurveSequencer
{
    constructor()
    {
        super();
        this.start = 0;
        this.value = vec4.create();
        this.operator = 0;
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
     * @param {vec4} value
     * @returns {vec4}
     */
    GetValueAt(time, value)
    {
        const vec4_0 = Tw2CurveSequencer.global.vec4_0;

        switch(this.operator)
        {
            case Tw2ColorSequencer.Operator.MULTIPLY:
                vec4.set(value, 1, 1, 1, 1);
                for (let i = 0; i < this.functions.length; ++i)
                {
                    this.functions[i].GetValueAt(time, vec4_0);
                    vec4.multiply(value, value, vec4_0);
                }
                return value;

            default:
                vec4.set(value, 0, 0, 0, 0);
                for (let i = 0; i < this.functions.length; ++i)
                {
                    this.functions[i].GetValueAt(time, vec4_0);
                    vec4.add(value, value, vec4_0);
                }
                return value;
        }
    }
}

/**
 * The sequencer's curve dimension
 * @type {number}
 */
Tw2ColorSequencer.inputDimension = 4;

/**
 * The sequencer's dimension
 * @type {number}
 */
Tw2ColorSequencer.outputDimension = 4;

/**
 * The sequencer's current value property
 * @type {string}
 */
Tw2ColorSequencer.valueProperty = 'value';

/**
 * The sequencer's type
 * @type {number}
 */
Tw2ColorSequencer.curveType = Tw2CurveSequencer.Type.SEQUENCER;

/**
 * The sequencer's curve array
 * @type {string}
 */
Tw2ColorSequencer.childArray = 'functions';

/**
 * Operators
 * @type {{MULTIPLY: number, ADD: number}}
 */
Tw2ColorSequencer.Operator = {
    MULTIPLY: 0,
    ADD: 1
};
