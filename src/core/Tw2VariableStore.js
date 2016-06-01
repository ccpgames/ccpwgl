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
 * Gets A Tw2 parameter constructor from a supplied value
 * @param {Number|String|Array.<Number>|Float32Array} value
 * @returns {null|Function}
 */
Tw2VariableStore.GetTw2ParameterType = function(value)
{
    if (value.constructor === (new glMatrixArrayType()).constructor || value.constructor === [].constructor)
    {
        switch (value.length)
        {
            case (16):
                return Tw2MatrixParameter;

            case (4):
                return Tw2Vector4Parameter;

            case (3):
                return Tw2Vector3Parameter;

            case (2):
                return Tw2Vector2Parameter;
        }
    }
    else if (typeof(value) == 'number')
    {
        return Tw2FloatParameter;
    }
    else if (typeof(value) == 'string')
    {
        return Tw2TextureParameter;
    }
}

/**
 * Registers a variable without a type
 * @param {string} name
 * @param {string|number|Float32Array} value
 * @returns {Tw2Parameter}
 * @constructor
 */
Tw2VariableStore.prototype.RegisterVariable = function(name, value)
{
    return this.RegisterVariableWithType(name, value, Tw2VariableStore.GetTw2ParameterType(value));
};

var variableStore = new Tw2VariableStore();
