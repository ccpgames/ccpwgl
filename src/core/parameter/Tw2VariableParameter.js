import {store} from '../../global';
import {Tw2Parameter} from './Tw2Parameter';

/**
 * Tw2VariableParameter
 *
 * @param {string} [name='']
 * @param {string} [variableName='']
 * @property {string} variableName
 * @class
 */
export class Tw2VariableParameter extends Tw2Parameter
{
    constructor(name = '', variableName = '')
    {
        super(name);
        this.variableName = variableName;
    }

    /**
     * Gets the linked variable
     * @returns {Tw2Parameter}
     */
    get variable()
    {
        return store.GetVariable(this.variableName);
    }

    /**
     * Gets the linked variable's size
     * @returns {number}
     */
    get size()
    {
        return this.variable ? this.variable.size : 0;
    }

    /**
     * Gets the variable's value
     * @param {boolean} [serialize]
     * @returns {?*}
     */
    GetValue(serialize)
    {
        return store.GetVariableValue(this.variableName, serialize);
    }

    /**
     * Apply
     * @param {*} a
     * @param {*} b
     * @param {*} c
     */
    Apply(a, b, c)
    {
        if (this.variable)
        {
            this.variable.Apply(a, b, c);
        }
    }

    /**
     * Not implemented for Variable Parameters
     * @returns {boolean} true if successful
     */
    AddCallback()
    {
        return false;
    }

    /**
     * Copies another variable parameter's value
     * @param {Tw2VariableParameter} parameter
     * @param {boolean} [includeName]
     */
    Copy(parameter, includeName)
    {
        if (includeName) this.name = parameter.name;
        this.variableName = parameter.variableName;
    }
}

