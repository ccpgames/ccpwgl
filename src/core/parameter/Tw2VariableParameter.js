import {variableStore} from '../global/Tw2VariableStore';

/**
 * Tw2VariableParameter
 * @param {string} [name=''] Parameter name
 * @param {string} [variableName='']
 * @property {string} name
 * @property {string} variableName
 * @constructor
 */
export function Tw2VariableParameter(name, variableName)
{
    if (typeof(name) !== 'undefined')
    {
        this.name = name;
    }
    else
    {
        this.name = '';
    }
    if (typeof(variableName) !== 'undefined')
    {
        this.variableName = variableName;
    }
    else
    {
        this.variableName = '';
    }
}

/**
 * Bind
 * @returns {boolean}
 * @prototype
 */
Tw2VariableParameter.prototype.Bind = function()
{
    return false;
};

/**
 * Apply
 * @param {Float32Array} constantBuffer
 * @param {number} offset
 * @param {number} size
 * @prototype
 */
Tw2VariableParameter.prototype.Apply = function(constantBuffer, offset, size)
{
    if (typeof(variableStore._variables[this.variableName]) !== 'undefined')
    {
        variableStore._variables[this.variableName].Apply(constantBuffer, offset, size);
    }
};
