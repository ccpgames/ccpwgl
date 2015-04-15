function Tw2RawData()
{
    this.nextOffset = 0;
    this.data = null;
    this.elements = {};
}

Tw2RawData.prototype.Declare = function (name, size)
{
    this.elements[name] = {'offset': this.nextOffset, 'size': size, 'array': null};
    this.nextOffset += size;
};

Tw2RawData.prototype.Create = function ()
{
    this.data = new Float32Array(this.nextOffset);
    for (var el in this.elements)
    {
        this.elements[el].array = this.data.subarray(this.elements[el].offset, this.elements[el].offset + this.elements[el].size);
    }
};

Tw2RawData.prototype.Set = function (name, value)
{
    var el = this.elements[name];
    this.data.set(value.length > el.size ? value.subarray(0, el.size) : value, el.offset);
};

Tw2RawData.prototype.Get = function (name)
{
    return this.elements[name].array;
};