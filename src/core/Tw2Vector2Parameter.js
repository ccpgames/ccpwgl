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
		this.value = new Float32Array(1, 1);
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