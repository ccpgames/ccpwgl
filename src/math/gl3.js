var gl3 = {};
gl3.EPSILON = 0.000001;
gl3.ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
gl3.RANDOM = Math.random;
gl3.ENABLE_SIMD = false;
gl3.DEG2RAD = Math.PI / 180;
gl3.RAD2DEG = 180 / Math.PI;
gl3.SIMD_AVAILABLE = (gl3.ARRAY_TYPE === this.Float32Array) && ('SIMD' in this);
gl3.USE_SIMD = gl3.ENABLE_SIMD && gl3.SIMD_AVAILABLE;

gl3.setMatrixArrayType = function(type)
{
    gl3.ARRAY_TYPE = type;
};

gl3.degToRad = function(degrees)
{
    return degrees * gl3.DEG2RAD;
};

gl3.radToDeg = function(radians)
    {
        return radians * gl3.RAD2DEG;
    },

    gl3.equals = function(a, b)
    {
        return Math.abs(a - b) <= gl3.EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
    }

gl3.clamp = function(value, min, max)
{
    return Math.max(min, Math.min(max, value));
};

gl3.isPowerOfTwo = function(value)
{
    return (value & (value - 1)) === 0 && value !== 0;
};

gl3.nearestPowerOfTwo = function(value)
{
    return Math.pow(2, Math.round(Math.log(value) / Math.LN2));
};

gl3.randInt = function(low, high)
{
    return low + Math.floor(Math.random() * (high - low + 1));
};

gl3.randFloat = function(low, high)
{
    return low + Math.random() * (high - low);
};

gl3.smoothStep = function(x, min, max)
{
    if (x <= min) return 0;
    if (x >= max) return 1;
    x = (x - min) / (max - min);
    return x * x * (3 - 2 * x);
};

gl3.smootherStep = function(x, min, max)
{
    if (x <= min) return 0;
    if (x >= max) return 1;
    x = (x - min) / (max - min);
    return x * x * x * (x * (x * 6 - 15) + 10);
};

gl3.generateUUID = function()
{
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = new Array(36);
    var rnd = 0,
        r;
    return function generateUUID()
    {
        for (var i = 0; i < 36; i++)
        {
            if (i === 8 || i === 13 || i === 18 || i === 23)
            {
                uuid[i] = '-';
            }
            else if (i === 14)
            {
                uuid[i] = '4';
            }
            else
            {
                if (rnd <= 0x02) rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
                r = rnd & 0xf;
                rnd = rnd >> 4;
                uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
            }
        }
        return uuid.join('');
    };
}();
