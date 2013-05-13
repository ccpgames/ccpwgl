function Tw2VariableParameter(name, variableName)
{
	if (typeof(name) != 'undefined')
	{
		this.name = name;
	}
	else
	{
		this.name = '';
	}
	if (typeof(variableName) != 'undefined')
	{
		this.variableName = variableName;
	}
	else
	{
		this.variableName = '';
	}
}

Tw2VariableParameter.prototype.Bind = function (constantBuffer, offset, size)
{
    return false;
};


Tw2VariableParameter.prototype.Apply = function (constantBuffer, offset, size)
{
    if (typeof (variableStore._variables[this.variableName]) != 'undefined')
    {
        variableStore._variables[this.variableName].Apply(constantBuffer, offset, size);
    }
};
