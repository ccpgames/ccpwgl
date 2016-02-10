/**
 * Tw2ValueBinding
 * @property {string} name
 * @property {Object} sourceObject
 * @property {string} sourceAttribute
 * @property {number} _sourceElement
 * @property {Object} destinationObject
 * @property {string} destinationAttribute
 * @property {number} _destinationElement
 * @property {number} scale
 * @property {quat4} offset
 * @property {null|Function} _copyFunc - The function to use when updating destination attributes
 * @constructor
 */
function Tw2ValueBinding()
{
    this.name = '';
    this.sourceObject = null;
    this.sourceAttribute = '';
    this.destinationObject = null;
    this.destinationAttribute = '';
    this.scale = 1;
    this.offset = quat4.create();
    this._copyFunc = null;
    this._sourceElement = 0;
    this._destinationElement = 0;
}

/**
 * Initializes the Value Binding
 * @prototypes
 */
Tw2ValueBinding.prototype.Initialize = function()
{
    if (!this.sourceObject || this.sourceAttribute == '')
    {
        return;
    }
    if (!this.destinationObject || this.destinationAttribute == '')
    {
        return;
    }

    var srcSwizzled = false;
    this._sourceElement = 0;
    var destSwizzled = false;
    this._destinationElement = 0;
    var srcSwizzle = this.sourceAttribute.substr(-2);

    if (srcSwizzle == '.x' || srcSwizzle == '.r')
    {
        srcSwizzled = true;
        this._sourceElement = 0;
        this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
    }
    else if (srcSwizzle == '.y' || srcSwizzle == '.g')
    {
        srcSwizzled = true;
        this._sourceElement = 1;
        this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
    }
    else if (srcSwizzle == '.z' || srcSwizzle == '.b')
    {
        srcSwizzled = true;
        this._sourceElement = 2;
        this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
    }
    else if (srcSwizzle == '.w' || srcSwizzle == '.a')
    {
        srcSwizzled = true;
        this._sourceElement = 3;
        this.sourceAttribute = this.sourceAttribute.substr(0, this.sourceAttribute.length - 2);
    }
    else if (this.sourceObject.constructor == (new Tw2Vector4Parameter()).constructor)
    {
        if (this.sourceAttribute == 'v1')
        {
            srcSwizzled = true;
            this._sourceElement = 0;
            this.sourceAttribute = 'value';
        }
        else if (this.sourceAttribute == 'v2')
        {
            srcSwizzled = true;
            this._sourceElement = 1;
            this.sourceAttribute = 'value';
        }
        else if (this.sourceAttribute == 'v3')
        {
            srcSwizzled = true;
            this._sourceElement = 2;
            this.sourceAttribute = 'value';
        }
        else if (this.sourceAttribute == 'v4')
        {
            srcSwizzled = true;
            this._sourceElement = 3;
            this.sourceAttribute = 'value';
        }
    }

    var destSwizzle = this.destinationAttribute.substr(-2);
    if (destSwizzle == '.x' || destSwizzle == '.r')
    {
        destSwizzled = true;
        this._destinationElement = 0;
        this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
    }
    else if (destSwizzle == '.y' || destSwizzle == '.g')
    {
        destSwizzled = true;
        this._destinationElement = 1;
        this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
    }
    else if (destSwizzle == '.z' || destSwizzle == '.b')
    {
        destSwizzled = true;
        this._destinationElement = 2;
        this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
    }
    else if (destSwizzle == '.w' || destSwizzle == '.a')
    {
        destSwizzled = true;
        this._destinationElement = 3;
        this.destinationAttribute = this.destinationAttribute.substr(0, this.destinationAttribute.length - 2);
    }
    else if (this.destinationObject.constructor == (new Tw2Vector4Parameter()).constructor)
    {
        if (this.destinationAttribute == 'v1')
        {
            destSwizzled = true;
            this._destinationElement = 0;
            this.destinationAttribute = 'value';
        }
        else if (this.destinationAttribute == 'v2')
        {
            destSwizzled = true;
            this._destinationElement = 1;
            this.destinationAttribute = 'value';
        }
        else if (this.destinationAttribute == 'v3')
        {
            destSwizzled = true;
            this._destinationElement = 2;
            this.destinationAttribute = 'value';
        }
        else if (this.destinationAttribute == 'v4')
        {
            destSwizzled = true;
            this._destinationElement = 3;
            this.destinationAttribute = 'value';
        }
    }
    if (!(this.sourceAttribute in this.sourceObject) || !(this.destinationAttribute in this.destinationObject))
    {
        return;
    }

    var srcIsArray = (this.sourceObject[this.sourceAttribute].constructor == (new Float32Array()).constructor || this.sourceObject[this.sourceAttribute].constructor.name == "Array");
    var destIsArray = (this.destinationObject[this.destinationAttribute].constructor == (new Float32Array()).constructor || this.destinationObject[this.destinationAttribute].constructor.name == "Array");

    if (srcIsArray == destIsArray && typeof this.sourceObject[this.sourceAttribute] == typeof this.destinationObject[this.destinationAttribute])
    {
        if (srcIsArray)
        {
            if (srcSwizzled)
            {
                if (destSwizzled)
                {
                    this._copyFunc = this._CopyElementToElement;
                }
                else
                {
                    this._copyFunc = this._ReplicateElement;
                }
            }
            else
            {
                if (this.sourceObject[this.sourceAttribute].length <= this.destinationObject[this.destinationAttribute].length)
                {
                    this._copyFunc = this._CopyArray;
                }
                else if (this.sourceObject[this.sourceAttribute].length == 16)
                {
                    this._copyFunc = this._ExtractPos;
                }
                else
                {
                    return;
                }
            }
        }
        else
        {
            this._copyFunc = this._CopyValueToValue;
        }
    }
    else if (srcIsArray && srcSwizzled && typeof this.destinationObject[this.destinationAttribute] == 'number')
    {
        this._copyFunc = this._CopyElementToValue;
    }
    else if (destIsArray && typeof this.sourceObject[this.sourceAttribute] == 'number')
    {
        if (destSwizzled)
        {
            this._copyFunc = this._CopyValueToElement;
        }
        else
        {
            this._copyFunc = this._ReplicateValue;
        }
    }
    else if (typeof this.sourceObject[this.sourceAttribute] == 'number' && typeof this.destinationObject[this.destinationAttribute] == 'boolean')
    {
        this._copyFunc = this._CopyFloatToBoolean;
    }
    else
    {
        return;
    }
};

/**
 * CopyValue
 * @prototype
 */
Tw2ValueBinding.prototype.CopyValue = function()
{
    if (this._copyFunc)
    {
        this._copyFunc.call(this);
        if ('OnValueChanged' in this.destinationObject)
        {
            this.destinationObject.OnValueChanged();
        }
    }
};

/**
 * _CopyValueToValue
 * @private
 */
Tw2ValueBinding.prototype._CopyValueToValue = function()
{
    this.destinationObject[this.destinationAttribute] = this.sourceObject[this.sourceAttribute] * this.scale + this.offset[0];
};

/**
 * _CopyArray
 * @private
 */
Tw2ValueBinding.prototype._CopyArray = function()
{
    var count = Math.min(this.destinationObject[this.destinationAttribute].length, this.sourceObject[this.sourceAttribute].length);
    for (var i = 0; i < count; ++i)
    {
        this.destinationObject[this.destinationAttribute][i] = this.sourceObject[this.sourceAttribute][i] * this.scale + this.offset[i];
    }
};

/**
 * _CopyElementToElement
 * @private
 */
Tw2ValueBinding.prototype._CopyElementToElement = function()
{
    this.destinationObject[this.destinationAttribute][this._destinationElement] = this.sourceObject[this.sourceAttribute][this._sourceElement] * this.scale + this.offset[0];
};

/**
 * _ReplicateValue
 * @private
 */
Tw2ValueBinding.prototype._ReplicateValue = function()
{
    for (var i = 0; i < this.destinationObject[this.destinationAttribute].length; ++i)
    {
        this.destinationObject[this.destinationAttribute][i] = this.sourceObject[this.sourceAttribute] * this.scale + this.offset[i];
    }
};

/**
 * _CopyArray
 * @private
 */
Tw2ValueBinding.prototype._ReplicateElement = function()
{
    for (var i = 0; i < this.destinationObject[this.destinationAttribute].length; ++i)
    {
        this.destinationObject[this.destinationAttribute][i] = this.sourceObject[this.sourceAttribute][this._sourceElement] * this.scale + this.offset[i];
    }
};

/**
 * _ExtractPos
 * @private
 */
Tw2ValueBinding.prototype._ExtractPos = function()
{
    for (var i = 0; i < this.destinationObject[this.destinationAttribute].length; ++i)
    {
        this.destinationObject[this.destinationAttribute][i] = this.sourceObject[this.sourceAttribute][i + 12] * this.scale + this.offset[i];
    }
};

/**
 * _CopyElementToValue
 * @private
 */
Tw2ValueBinding.prototype._CopyElementToValue = function()
{
    this.destinationObject[this.destinationAttribute] = this.sourceObject[this.sourceAttribute][this._sourceElement] * this.scale + this.offset[0];
};

/**
 * _CopyValueToElement
 * @private
 */
Tw2ValueBinding.prototype._CopyValueToElement = function()
{
    this.destinationObject[this.destinationAttribute][this._destinationElement] = this.sourceObject[this.sourceAttribute] * this.scale + this.offset[0];
};

/**
 * _CopyFloatToBoolean
 * @private
 */
Tw2ValueBinding.prototype._CopyFloatToBoolean = function()
{
    this.destinationObject[this.destinationAttribute] = this.sourceObject[this.sourceAttribute] != 0;
};
