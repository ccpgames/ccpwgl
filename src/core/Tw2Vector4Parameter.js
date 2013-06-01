function Tw2Vector4Parameter(name, value)
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
		this.value = quat4.create([1, 1, 1, 1]);
	}
	this.constantBuffer = null;
	this.offset = 0;
}

Tw2Vector4Parameter.prototype.Bind = function (constantBuffer, offset, size)
{
    if (this.constantBuffer != null || size < 4)
    {
        return false;
    }
    this.constantBuffer = constantBuffer;
    this.offset = offset;
    this.Apply(this.constantBuffer, this.offset, size);
    return true;
};

Tw2Vector4Parameter.prototype.Unbind = function () 
{
    this.constantBuffer = null;
};

Tw2Vector4Parameter.prototype.SetValue = function (value)
{
    this.value = value;
    if (this.constantBuffer != null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

Tw2Vector4Parameter.prototype.OnValueChanged = function ()
{
    if (this.constantBuffer != null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

Tw2Vector4Parameter.prototype.Apply = function (constantBuffer, offset, size)
{
    constantBuffer.set(this.value, offset);
};