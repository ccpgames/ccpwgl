import { Tw2CurveSequencer } from './Tw2CurveSequencer';

/**
 * Tw2ScalarSequencer
 *
 * @property {string} name
 * @property {number} value
 * @property {number} operator
 * @property {Array<Tw2CurveSequencer>} functions
 * @property {number} inMinClamp
 * @property {number} inMaxClamp
 * @property {number} outMinClamp
 * @property {number} outMaxClamp
 * @property {boolean} clamping
 * @class
 */
export class Tw2ScalarSequencer extends Tw2CurveSequencer
{
    constructor()
    {
        super();
        this.value = 0;
        this.operator = 0;
        this.functions = [];
        this.inMinClamp = 0;
        this.inMaxClamp = 1;
        this.outMinClamp = 0;
        this.outMaxClamp = 1;
        this.clamping = false;
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
     *
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.value = this.GetValueAt(time);
    }

    /**
     * Gets a value at a specific time
     *
     * @param {number} time
     * @returns {number}
     */
    GetValueAt(time)
    {
        let value;

        switch(this.operator)
        {
            case Tw2ScalarSequencer.Operator.MULTIPLY:
                value = 1;
                for (let i = 0; i < this.functions.length; ++i)
                {
                    let v = this.functions[i].GetValueAt(time);
                    if (this.clamping) 
                    {
                        v = Math.min(Math.max(v, this.inMinClamp), this.inMaxClamp);
                    }
                    value *= v;
                }
                break;
                
            default:
                value = 0;
                for (let i = 0; i < this.functions.length; ++i)
                {
                    let v = this.functions[i].GetValueAt(time);
                    if (this.clamping)
                    {
                        v = Math.min(Math.max(v, this.inMinClamp), this.inMaxClamp);
                    }
                    value += v;
                }
        }
        
        if (this.clamping) 
        {
            value = Math.min(Math.max(value, this.outMinClamp), this.outMaxClamp);
        }
        
        return value;
    }
}

/**
 * The sequencer's curve dimension
 * @type {number}
 */
Tw2ScalarSequencer.inputDimension = 1;

/**
 * The sequencer's dimension
 * @type {number}
 */
Tw2ScalarSequencer.outputDimension = 1;

/**
 * The sequencer's current value property
 * @type {string}
 */
Tw2ScalarSequencer.valueProperty = 'value';

/**
 * The sequencer's type
 * @type {number}
 */
Tw2ScalarSequencer.curveType = Tw2CurveSequencer.Type.SEQUENCER;

/**
 * The sequencer's curve properties
 * @type {string}
 */
Tw2ScalarSequencer.childArray = 'functions';

/**
 * Operator types
 * @type {{MULTIPLY: number, ADD: number}}
 */
Tw2ScalarSequencer.Operator = {
    MULTIPLY: 0,
    ADD: 1
};
