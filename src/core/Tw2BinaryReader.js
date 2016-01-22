/**
 * Tw2BinaryReader
 * @param data
 * @constructor
 */
function Tw2BinaryReader(data)
{
    this.data = data;
    this.cursor = 0;
}

/**
 * ReadUInt8
 * @returns {*}
 * @prototype
 */
Tw2BinaryReader.prototype.ReadUInt8 = function()
{
    return this.data[this.cursor++];
};

/**
 * ReadInt8
 * @returns {*}
 * @prototype
 */
Tw2BinaryReader.prototype.ReadInt8 = function()
{
    var val = this.data[this.cursor++];
    if (val > 0x7F)
    {
        val = (val - 0xff) - 1;
    }
    return val;
};

/**
 * ReadUInt16
 * @returns {*}
 * @prototype
 */
Tw2BinaryReader.prototype.ReadUInt16 = function()
{
    return this.data[this.cursor++] + (this.data[this.cursor++] << 8);
};

/**
 * ReadInt16
 * @returns {*}
 * @prototype
 */
Tw2BinaryReader.prototype.ReadInt16 = function()
{
    var val = this.data[this.cursor++] + (this.data[this.cursor++] << 8);
    if (val > 0x7FFF)
    {
        val = (val - 0xffff) - 1;
    }
    return val;
};

/**
 * ReadUInt32
 * @returns {*}
 * @prototype
 */
Tw2BinaryReader.prototype.ReadUInt32 = function()
{
    return this.data[this.cursor++] + (this.data[this.cursor++] << 8) + (this.data[this.cursor++] << 16) + ((this.data[this.cursor++] << 24) >>> 0);
};

/**
 * ReadInt32
 * @returns {*}
 * @prototype
 */
Tw2BinaryReader.prototype.ReadInt32 = function()
{
    var val = this.data[this.cursor++] + (this.data[this.cursor++] << 8) + (this.data[this.cursor++] << 16) + ((this.data[this.cursor++] << 24) >>> 0);
    if (val > 0x7FFFFFFF)
    {
        val = (val - 0xffffffff) - 1;
    }
    return val;
};

/**
 * ReadFloat16
 * @returns {number}
 * @prototype
 */
Tw2BinaryReader.prototype.ReadFloat16 = function()
{
    var b2 = this.data[this.cursor++],
        b1 = this.data[this.cursor++];
    var sign = 1 - (2 * (b1 >> 7)); // sign = bit 0
    var exp = ((b1 >> 2) & 0x1f) - 15; // exponent = bits 1..5
    var sig = ((b1 & 3) << 8) | b2; // significand = bits 6..15
    if (sig == 0 && exp == -15)
        return 0.0;
    return sign * (1 + sig * Math.pow(2, -10)) * Math.pow(2, exp);
};

/**
 * ReadFloat32
 * @returns {number}
 * @prototype
 */
Tw2BinaryReader.prototype.ReadFloat32 = function()
{
    var b4 = this.data[this.cursor++],
        b3 = this.data[this.cursor++],
        b2 = this.data[this.cursor++],
        b1 = this.data[this.cursor++];
    var sign = 1 - (2 * (b1 >> 7)); // sign = bit 0
    var exp = (((b1 << 1) & 0xff) | (b2 >> 7)) - 127; // exponent = bits 1..8
    var sig = ((b2 & 0x7f) << 16) | (b3 << 8) | b4; // significand = bits 9..31
    if (sig == 0 && exp == -127)
        return 0.0;
    return sign * (1 + sig * Math.pow(2, -23)) * Math.pow(2, exp);
};

/**
 * ReadString
 * @returns {string}
 * @prototype
 */
Tw2BinaryReader.prototype.ReadString = function()
{
    var length = this.data[this.cursor++];
    var str = '';
    for (var i = 0; i < length; ++i)
    {
        str += String.fromCharCode(this.data[this.cursor++]);
    }
    return str;
};
