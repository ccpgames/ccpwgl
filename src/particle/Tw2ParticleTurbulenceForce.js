/**
 * Tw2ParticleTurbulenceForce
 * @property {number} noiseLevel
 * @property {number} noiseRatio
 * @property {vec3} amplitude
 * @property {quat4} frequency
 * @property {number} _time
 * @constructor
 */
function Tw2ParticleTurbulenceForce()
{
    this.noiseLevel = 3;
    this.noiseRatio = 0.5;
    this.amplitude = vec3.create([1, 1, 1]);
    this.frequency = quat4.create([1, 1, 1, 1]);
    this._time = 0;
}

var s_noiseLookup = [];
var s_permutations = [];
var s_globalNoiseTemps = [];

function InitializeNoise()
{
    for (var i = 0; i < 256; i++)
    {
        s_noiseLookup[i] = quat4.create([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);
        s_permutations[i] = i;
    }

    i = 256;
    while (--i)
    {
        var tmp = s_permutations[i];
        var index = Math.floor(Math.random() * 256);
        s_permutations[i] = s_permutations[index];
        s_permutations[index] = tmp;
    }

    for (i = 0; i < 256; i++)
    {
        s_permutations[256 + i] = s_permutations[i];
        s_noiseLookup[256 + i] = s_noiseLookup[i];
        s_noiseLookup[256 * 2 + i] = s_noiseLookup[i];
    }
    for (i = 0; i < 15; ++i)
    {
        s_globalNoiseTemps[i] = vec3.create();
    }
}
InitializeNoise();

function AddNoise(pos_0, pos_1, pos_2, pos_3, power, result)
{
    pos_0 += 4096;
    pos_1 += 4096;
    pos_2 += 4096;
    pos_3 += 4096;

    var a_0 = Math.floor(pos_0);
    var a_1 = Math.floor(pos_1);
    var a_2 = Math.floor(pos_2);
    var a_3 = Math.floor(pos_3);
    var t_0 = pos_0 - a_0;
    var t_1 = pos_1 - a_1;
    var t_2 = pos_2 - a_2;
    var t_3 = pos_3 - a_3;
    a_0 &= 255;
    a_1 &= 255;
    a_2 &= 255;
    a_3 &= 255;
    var b_0 = a_0 + 1;
    var b_1 = a_1 + 1;
    var b_2 = a_2 + 1;
    var b_3 = a_3 + 1;

    var i = s_permutations[a_0];
    var j = s_permutations[b_0];

    var b00 = s_permutations[i + a_1];
    var b10 = s_permutations[j + a_1];
    var b01 = s_permutations[i + b_1];
    var b11 = s_permutations[j + b_1];

    var c00 = vec3.lerp(s_noiseLookup[b00 + a_2 + a_3], s_noiseLookup[b10 + a_2 + a_3], t_0, s_globalNoiseTemps[0]);
    var c10 = vec3.lerp(s_noiseLookup[b01 + a_2 + a_3], s_noiseLookup[b11 + a_2 + a_3], t_0, s_globalNoiseTemps[1]);
    var c01 = vec3.lerp(s_noiseLookup[b00 + b_2 + a_3], s_noiseLookup[b10 + b_2 + a_3], t_0, s_globalNoiseTemps[2]);
    var c11 = vec3.lerp(s_noiseLookup[b00 + b_2 + a_3], s_noiseLookup[b10 + b_2 + a_3], t_0, s_globalNoiseTemps[3]);
    var c0 = vec3.lerp(c00, c10, t_1, s_globalNoiseTemps[4]);
    var c1 = vec3.lerp(c01, c11, t_1, s_globalNoiseTemps[5]);
    var c = vec3.lerp(c0, c1, t_2, s_globalNoiseTemps[6]);

    c00 = vec3.lerp(s_noiseLookup[b00 + a_2 + b_3], s_noiseLookup[b10 + a_2 + b_3], t_0, s_globalNoiseTemps[7]);
    c10 = vec3.lerp(s_noiseLookup[b01 + a_2 + b_3], s_noiseLookup[b11 + a_2 + b_3], t_0, s_globalNoiseTemps[8]);
    c01 = vec3.lerp(s_noiseLookup[b00 + b_2 + b_3], s_noiseLookup[b10 + b_2 + b_3], t_0, s_globalNoiseTemps[9]);
    c11 = vec3.lerp(s_noiseLookup[b00 + b_2 + b_3], s_noiseLookup[b10 + b_2 + b_3], t_0, s_globalNoiseTemps[10]);
    c0 = vec3.lerp(c00, c10, t_1, s_globalNoiseTemps[11]);
    c1 = vec3.lerp(c01, c11, t_1, s_globalNoiseTemps[12]);
    var d = vec3.lerp(c0, c1, t_2, s_globalNoiseTemps[13]);

    var r = vec3.lerp(c, d, t_3, s_globalNoiseTemps[14]);
    result[0] += r[0] * power;
    result[1] += r[1] * power;
    result[2] += r[2] * power;
}

/**
 * tempNoise
 * @type {quat4}
 * @prototype
 */
Tw2ParticleTurbulenceForce.tempNoise = quat4.create();

/**
 * ApplyForce
 * @param position
 * @param velocity
 * @param force
 * @prototype
 */
Tw2ParticleTurbulenceForce.prototype.ApplyForce = function(position, velocity, force)
{
    if (this.noiseLevel == 0)
    {
        return;
    }
    var pos_0 = position.buffer[position.offset] * this.frequency[0];
    var pos_1 = position.buffer[position.offset + 1] * this.frequency[1];
    var pos_2 = position.buffer[position.offset + 2] * this.frequency[2];
    var pos_3 = this._time * this.frequency[3];
    var noise = Tw2ParticleTurbulenceForce.tempNoise;
    noise[0] = noise[1] = noise[2] = noise[3] = 0;
    var power = 0.5;
    var sum = 0;
    var frequency = 1 / this.noiseRatio;
    for (var i = 0; i < this.noiseLevel; ++i)
    {
        AddNoise(pos_0, pos_1, pos_2, pos_3, power, noise);
        sum += power;
        pos_0 *= frequency;
        pos_1 *= frequency;
        pos_2 *= frequency;
        pos_3 *= frequency;
        power *= this.noiseRatio;
    }
    force[0] += noise[0] * this.amplitude[0] * sum;
    force[1] += noise[1] * this.amplitude[1] * sum;
    force[2] += noise[2] * this.amplitude[2] * sum;
};

/**
 * Internal render/update function. It is called every frame.
 * @param {number} dt - delta Time
 * @prototype
 */
Tw2ParticleTurbulenceForce.prototype.Update = function(dt)
{
    this._time += dt;
};
