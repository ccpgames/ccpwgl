function Tw2FloatParameter(name, value)
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
		this.value = 1;
    }
    this.constantBuffer = null;
}


Tw2FloatParameter.prototype.Bind = function (constantBuffer, offset, size)
{
    if (this.constantBuffer != null || size < 1)
    {
        return false;
    }
    this.constantBuffer = constantBuffer;
    this.offset = offset;
    this.Apply(this.constantBuffer, this.offset, size);
};

Tw2FloatParameter.prototype.Unbind = function () 
{
    this.constantBuffer = null;
};

Tw2FloatParameter.prototype.OnValueChanged = function ()
{
    if (this.constantBuffer != null)
    {
        this.constantBuffer[this.offset] = this.value;
    }
};

Tw2FloatParameter.prototype.Apply = function (constantBuffer, offset, size)
{
    constantBuffer[offset] = this.value;
};