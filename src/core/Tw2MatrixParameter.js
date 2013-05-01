function Tw2MatrixParameter(name, value)
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
		this.value = mat4.create();
        mat4.identity(this.value);
	}
	this.constantBuffer = null;
	this.offset = 0;
}

Tw2MatrixParameter.prototype.Bind = function (constantBuffer, offset, size)
{
    if (this.constantBuffer != null || size < 16)
    {
        return false;
    }
    this.constantBuffer = constantBuffer;
    this.offset = offset;
    this.Apply(this.constantBuffer, this.offset, size);
};

Tw2MatrixParameter.prototype.SetValue = function (value)
{
    this.value = value;
    if (this.constantBuffer != null)
    {
        this.constantBuffer.set(this.value, this.offset);
    }
};

Tw2MatrixParameter.prototype.Apply = function (constantBuffer, offset, size)
{
    constantBuffer.set(this.value, offset);
};
