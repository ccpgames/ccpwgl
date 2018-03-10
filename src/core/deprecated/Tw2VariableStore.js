import {util} from '../../math';
import {
    Tw2MatrixParameter,
    Tw2Vector4Parameter,
    Tw2Vector3Parameter,
    Tw2Vector2Parameter,
    Tw2FloatParameter,
    Tw2TextureParameter
} from '../parameter/index';

/**
 * Tw2VariableStore
 * @property {Object.< string, Parameter>} _variables
 * @constructor
 */
export class Tw2VariableStore
{
    constructor()
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
    RegisterVariableWithType(name, value, type)
    {
        return this._variables[name] = new type(name, value);
    }

    /**
     * Registers a variable without a value
     * @param {string} name
     * @param {Parameter} type
     * @returns {Parameter}
     * @constructor
     */
    RegisterType(name, type)
    {
        return this._variables[name] = new type(name);
    }

    /**
     * Registers a variable without a type
     * @param {string} name
     * @param {string|number|Float32Array} value
     * @returns {Parameter}
     */
    RegisterVariable(name, value)
    {
        const Type = Tw2VariableStore.GetTw2ParameterType(value);
        return Type ? this.RegisterVariableWithType(name, value, Type) : null;
    }

    /**
     * Gets A Tw2 parameter constructor from a supplied value
     * @param {Number|String|Array.<Number>|Float32Array} value
     * @returns {null|Parameter}
     */
    static GetTw2ParameterType(value)
    {
        if (util.isArrayLike(value))
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
    }
}