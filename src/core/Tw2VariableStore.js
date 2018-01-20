import {Tw2MatrixParameter} from './Tw2MatrixParameter';
import {Tw2Vector4Parameter} from './Tw2Vector4Parameter';
import {Tw2Vector3Parameter} from './Tw2Vector3Parameter';
import {Tw2Vector2Parameter} from './Tw2Vector2Parameter';
import {Tw2FloatParameter} from './Tw2FloatParameter';
import {Tw2TextureParameter} from './Tw2TextureParameter';


/**
 * Tw2VariableStore
 * @property {Object.< string, Parameter>} _variables
 * @constructor
 */
function Tw2VariableStore()
{
    this._variables = {};
}

/**
 * Registers a variable
 * @param {string} name
 * @param {string|number|Float32Array|vec3|mat4} value
 * @param {Parameter} type
 * @returns {Parameter}
 * @constructor
 */
Tw2VariableStore.prototype.RegisterVariableWithType = function(name, value, type)
{
    return this._variables[name] = new type(name, value);
};

/**
 * Registers a variable without a value
 * @param {string} name
 * @param {Parameter} type
 * @returns {Parameter}
 * @constructor
 */
Tw2VariableStore.prototype.RegisterType = function(name, type)
{
    return this._variables[name] = new type(name);
};

/**
 * Gets A Tw2 parameter constructor from a supplied value
 * @param {Number|String|Array.<Number>|Float32Array} value
 * @returns {null|Parameter}
 */
Tw2VariableStore.GetTw2ParameterType = function(value)
{
    if (value && value.constructor.name.toUpperCase().includes('ARRAY'))
    {
        switch (value.length)
        {
            case 16:
                return Tw2MatrixParameter;

            case 4:
                return Tw2Vector4Parameter;

            case 3:
                return Tw2Vector3Parameter;

            case 2:
                return Tw2Vector2Parameter;

            case 1:
                return Tw2FloatParameter;
        }
    }
    else if (typeof(value) === 'number')
    {
        return Tw2FloatParameter;
    }
    else if (typeof(value) === 'string')
    {
        return Tw2TextureParameter;
    }
};

/**
 * Registers a variable without a type
 * @param {string} name
 * @param {string|number|Float32Array} value
 * @returns {Parameter}
 * @constructor
 */
Tw2VariableStore.prototype.RegisterVariable = function(name, value)
{
    const Type = Tw2VariableStore.GetTw2ParameterType(value);
    return Type ? this.RegisterVariableWithType(name, value, Type) : null;
};

/**
 * Registers variables from an object or array of objects
 * @param obj
 */
Tw2VariableStore.prototype.RegisterVariables = function(obj)
{
    if (obj)
    {
        obj = Array.isArray(obj) ? obj : [obj];
        for (let i = 0; i < obj.length; i++)
        {
            for (let key in obj[i])
            {
                if (obj[i].hasOwnProperty(key))
                {
                    this.RegisterVariable(key, obj[i][key]);
                }
            }
        }
    }
};

/**
 * Register
 * @param opt
 */
Tw2VariableStore.prototype.Register = function(opt)
{
    if (opt)
    {
        this.RegisterVariables(opt.variables);
    }
};

export const variableStore = new Tw2VariableStore();