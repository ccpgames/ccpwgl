/**
 * Tw2VariableStore
 * @property {Object.< string, Tw2Parameter>} _variables
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
 * @param {Tw2Parameter} type
 * @returns {Tw2Parameter}
 * @constructor
 */
Tw2VariableStore.prototype.RegisterVariableWithType = function(name, value, type)
{
    return this._variables[name] = new type(name, value);
};

/**
 * Registers a variable without a value
 * @param {string} name
 * @param {Tw2Parameter} type
 * @returns {Tw2Parameter}
 * @constructor
 */
Tw2VariableStore.prototype.RegisterType = function(name, type)
{
    return this._variables[name] = new type(name);
};

/**
 * Registers a variable without a type
 * @param {string} name
 * @param {string|number|Float32Array|vec3|mat4} value
 * @returns {Tw2Parameter}
 * @constructor
 */
Tw2VariableStore.prototype.RegisterVariable = function(name, value)
{
    if (value.constructor == (new glMatrixArrayType()).constructor)
    {
        if (value.length == 16)
        {
            return this.RegisterVariableWithType(name, value, Tw2MatrixParameter);
        }
        else if (value.length == 4)
        {
            return this.RegisterVariableWithType(name, value, Tw2Vector4Parameter);
        }
        else if (value.length == 3)
        {
            return this.RegisterVariableWithType(name, value, Tw2Vector3Parameter);
        }
        else if (value.length == 2)
        {
            return this.RegisterVariableWithType(name, value, Tw2Vector2Parameter);
        }
    }
    else if (typeof(value) == 'number')
    {
        return this.RegisterVariableWithType(name, value, Tw2FloatParameter);
    }
    else if (typeof(value) == 'string')
    {
        return this.RegisterVariableWithType(name, value, Tw2TextureParameter);
    }
};

var variableStore = new Tw2VariableStore();
