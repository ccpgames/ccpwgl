function Tw2Vector2Parameter(name, value)
{
	if (typeof(name) != 'undefined')
	{
		this.name = name;
	}
	else
	{
		this.name = '';
	}
	if (typeof(value) != 'undefined')
	{
		this.value = value;
	}
	else
	{
		this.value = new Float32Array([1, 1]);
	}
}

Tw2Vector2Parameter.prototype.Bind = function (constantBuffer, offset, size)
{
    if (this.constantBuffer != null || size < 2)
    {
        return false;
    }
    this.constantBuffer = constantBuffer;
    this.offset = offset;
    this.Apply(this.constantBuffer, this.offset, size);
    return true;
};

Tw2Vector2Parameter.prototype.Unbind = function ()
{
    this.constantBuffer = null;
};

Tw2Vector2Parameter.prototype.SetValue = function (value)
{
    this.value = value;
    if (this.constantBuffer != null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

Tw2Vector2Parameter.prototype.OnValueChanged = function ()
{
    if (this.constantBuffer != null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

Tw2Vector2Parameter.prototype.Apply = function (constantBuffer, offset, size)
{
    constantBuffer.set(this.value, offset);
};

Tw2Vector2Parameter.prototype.GetValue = function()
{
    if (this.constantBuffer != null)
    {
    	return this.constantBuffer.subarray(this.offset, this.offset + this.value.length);
    }
    
    return this.value;
};

Tw2Vector2Parameter.prototype.GetIndexValue = function(index)
{
    if (typeof this.value[index] === 'undefined')
    {
        throw "Invalid Index";
    }
    
    if (this.constantBuffer != null)
    {
    	return this.constantBuffer[this.offset + index];
    }
    
    return this.value[index];
};

Tw2Vector2Parameter.prototype.SetIndexValue = function(index, value)
{
    if (typeof this.value[index] === 'undefined')
    {
        throw "Invalid Index";
    }
    
    this.value[index] = value;
    
    if (this.constantBuffer != null)
    {
        this.constantBuffer[this.offset + index] = value;
    }
};

