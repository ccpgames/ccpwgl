import {vec3} from './vec3';
import {vec4} from './vec4';

export const noise = {};

/**
 * Generates turbulent noise
 *
 * @param {vec4} out
 * @param {number} pos_0
 * @param {number} pos_1
 * @param {number} pos_2
 * @param {number} pos_3
 * @param {number} power
 * @returns {vec4} out
 */
noise.turbulence = (function ()
{
    const
        s_noiseLookup = [],
        s_permutations = [],
        s_globalNoiseTemps = [];

    let s_initialized = false;

    /**
     * Initializes noise
     */
    function initialize()
    {
        for (let i = 0; i < 256; i++)
        {
            s_noiseLookup[i] = vec4.fromValues(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
            s_permutations[i] = i;
        }

        let i = 256;
        while (--i)
        {
            const
                tmp = s_permutations[i],
                index = Math.floor(Math.random() * 256);

            s_permutations[i] = s_permutations[index];
            s_permutations[index] = tmp;
        }

        for (let i = 0; i < 256; i++)
        {
            s_permutations[256 + i] = s_permutations[i];
            s_noiseLookup[256 + i] = s_noiseLookup[i];
            s_noiseLookup[256 * 2 + i] = s_noiseLookup[i];
        }

        for (let i = 0; i < 15; ++i)
        {
            s_globalNoiseTemps[i] = vec3.create();
        }

        s_initialized = true;
    }

    return function turbulence(out, pos_0, pos_1, pos_2, pos_3, power)
    {
        if (!s_initialized) initialize();

        pos_0 += 4096;
        pos_1 += 4096;
        pos_2 += 4096;
        pos_3 += 4096;

        let a_0 = Math.floor(pos_0),
            a_1 = Math.floor(pos_1),
            a_2 = Math.floor(pos_2),
            a_3 = Math.floor(pos_3);

        const
            t_0 = pos_0 - a_0,
            t_1 = pos_1 - a_1,
            t_2 = pos_2 - a_2,
            t_3 = pos_3 - a_3;

        a_0 &= 255;
        a_1 &= 255;
        a_2 &= 255;
        a_3 &= 255;

        const
            b_0 = a_0 + 1,
            b_1 = a_1 + 1,
            b_2 = a_2 + 1,
            b_3 = a_3 + 1;

        const
            i = s_permutations[a_0],
            j = s_permutations[b_0];

        const
            b00 = s_permutations[i + a_1],
            b10 = s_permutations[j + a_1],
            b01 = s_permutations[i + b_1],
            b11 = s_permutations[j + b_1];

        let c00 = vec3.lerp(s_globalNoiseTemps[0], s_noiseLookup[b00 + a_2 + a_3], s_noiseLookup[b10 + a_2 + a_3], t_0);
        let c10 = vec3.lerp(s_globalNoiseTemps[1], s_noiseLookup[b01 + a_2 + a_3], s_noiseLookup[b11 + a_2 + a_3], t_0);
        let c01 = vec3.lerp(s_globalNoiseTemps[2], s_noiseLookup[b00 + b_2 + a_3], s_noiseLookup[b10 + b_2 + a_3], t_0);
        let c11 = vec3.lerp(s_globalNoiseTemps[3], s_noiseLookup[b00 + b_2 + a_3], s_noiseLookup[b10 + b_2 + a_3], t_0);
        let c0 = vec3.lerp(s_globalNoiseTemps[4], c00, c10, t_1);
        let c1 = vec3.lerp(s_globalNoiseTemps[5], c01, c11, t_1);
        const c = vec3.lerp(s_globalNoiseTemps[6], c0, c1, t_2);

        c00 = vec3.lerp(s_globalNoiseTemps[7], s_noiseLookup[b00 + a_2 + b_3], s_noiseLookup[b10 + a_2 + b_3], t_0);
        c10 = vec3.lerp(s_globalNoiseTemps[8], s_noiseLookup[b01 + a_2 + b_3], s_noiseLookup[b11 + a_2 + b_3], t_0);
        c01 = vec3.lerp(s_globalNoiseTemps[9], s_noiseLookup[b00 + b_2 + b_3], s_noiseLookup[b10 + b_2 + b_3], t_0);
        c11 = vec3.lerp(s_globalNoiseTemps[10], s_noiseLookup[b00 + b_2 + b_3], s_noiseLookup[b10 + b_2 + b_3], t_0);
        c0 = vec3.lerp(s_globalNoiseTemps[11], c00, c10, t_1);
        c1 = vec3.lerp(s_globalNoiseTemps[12], c01, c11, t_1);
        const d = vec3.lerp(s_globalNoiseTemps[13], c0, c1, t_2);
        const r = vec3.lerp(s_globalNoiseTemps[14], c, d, t_3);

        out[0] += r[0] * power;
        out[1] += r[1] * power;
        out[2] += r[2] * power;
        return out;
    };
})();

/**
 * Perlin_noise1
 *
 * @param {number} a
 * @returns {number}
 */
noise.perlin1 = (function ()
{
    let p_initialized = false,
        p_B = 0x100,
        p_BM = 0xff,
        p_N = 0x1000,
        p_p = null,
        p_g1 = null;

    /**
     * Initializes Perlin Noise
     */
    function initialize()
    {
        p_p = new Array(p_B + p_B + 2);
        p_g1 = new Array(p_B + p_B + 2);

        let i = 0,
            j = 0,
            k = 0;

        for (i = 0; i < p_B; i++)
        {
            p_p[i] = i;
            p_g1[i] = Math.random() * 2 - 1;
        }

        while (--i)
        {
            k = p_p[i];
            p_p[i] = p_p[j = Math.floor(Math.random() * p_B)];
            p_p[j] = k;
        }

        for (i = 0; i < p_B + 2; i++)
        {
            p_p[p_B + i] = p_p[i];
            p_g1[p_B + i] = p_g1[i];
        }

        p_initialized = true;
    }

    return function perlin1(a)
    {
        if (!p_initialized) initialize();

        let t = a + p_N,
            bx0 = Math.floor(t) & p_BM,
            bx1 = (bx0 + 1) & p_BM,
            rx0 = t - Math.floor(t),
            rx1 = rx0 - 1;

        let sx = rx0 * rx0 * (3.0 - 2.0 * rx0),
            u = rx0 * p_g1[p_p[bx0]],
            v = rx1 * p_g1[p_p[bx1]];

        return u + sx * (v - u);
    };
})();

/**
 * PerlinNoise1D
 *
 * @param x
 * @param alpha
 * @param beta
 * @param n
 * @returns {number}
 */
noise.perlin1D = function (x, alpha, beta, n)
{
    let sum = 0,
        p = x,
        scale = 1;

    for (let i = 0; i < n; ++i)
    {
        sum += noise.perlin1(p) / scale;
        scale *= alpha;
        p *= beta;
    }
    return sum;
};


