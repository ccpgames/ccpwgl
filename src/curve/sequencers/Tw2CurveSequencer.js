import {Tw2Curve} from '../curves';

/**
 * Tw2CurveSequencer base class
 *
 * @class
 */
export class Tw2CurveSequencer extends Tw2Curve
{
    constructor()
    {
        super();
    }

    /**
     * Legacy sequencer sorting
     * @param {Tw2CurveSequencer} sequencer
     */
    static Sort(sequencer)
    {
        let curves = sequencer['functions'];
        if (curves && curves.length)
        {
            for (let i = 0; i < curves.length; i++)
            {
                if (curves[i] && 'Sort' in curves[i]) curves[i].Sort();
            }
        }
    }

    /**
     * Standard sequencer sorting
     * @param {Tw2CurveSequencer} sequencer
     */
    static Sort2(sequencer)
    {
        const names = sequencer.constructor.childProperties;
        if (names)
        {
            for (let i = 0; i < names.length; i++)
            {
                let curve = sequencer[names[i]];
                if (curve && 'Sort' in curve) curve.Sort();
            }
        }
    }
}

/**
 * The sequencer's curve property names
 * @type {?Array.<string>}
 */
Tw2CurveSequencer.childProperties = null;

/**
 * The sequencer's curve array
 * @type {?string}
 */
Tw2CurveSequencer.childArray = null;

/**
 * Operator types
 * @type {null}
 */
Tw2CurveSequencer.Operator = null;