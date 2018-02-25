import {vec3, vec4} from 'gl-matrix';
import {num} from './num';
export {vec3};

/**
 * Sets a vec3 with cartesian coordinates converted from a vec3 containing spherical coordinate values
 * @param {vec3} out            - receiving vec3
 * @param {vec3} spherical      - source vec3 with spherical coordinates (phi, theta, radius)
 * @returns {vec3} out          - receiving vec3
 */
vec3.cartFromSpherical = function(out, spherical)
{
    const
        phi = spherical[0],
        theta = spherical[1],
        radius = spherical[2];

    out[0] = radius * Math.sin(phi) * Math.sin(theta);
    out[1] = radius * Math.cos(theta);
    out[2] = radius * Math.cos(phi) * Math.sin(theta);
    return out;
};

/**
 * Sets a vec3 with cartesian coordinates from a vec3 containing spherical coordinate values, and a center point
 * @param {vec3} out            - receiving vec3
 * @param {vec3} spherical      - source vec3 with spherical coordinates (phi, theta, radius)
 * @param {vec3} center         - center
 * @returns {vec3} out          - receiving vec3
 */
vec3.cartFromSphericalAndCenter = function(out, spherical, center)
{
    const
        phi = spherical[0],
        theta = spherical[1],
        radius = spherical[2];

    out[0] = radius * Math.sin(phi) * Math.sin(theta) + center[0];
    out[1] = radius * Math.cos(theta) + center[1];
    out[2] = radius * Math.cos(phi) * Math.sin(theta) + center[2];
    return out;
};

/**
 * Exponential decay
 *
 * @param {vec3} out
 * @param {vec3} omega0
 * @param {vec3} torque
 * @param {number} I
 * @param {number} drag
 * @param {number} time
 * @returns {vec3} out
 */
vec3.exponentialDecay = function(out, omega0, torque, I, drag, time)
{
    out[0] = num.exponentialDecay(omega0[0], torque[0], I, drag, time);
    out[1] = num.exponentialDecay(omega0[1], torque[1], I, drag, time);
    out[2] = num.exponentialDecay(omega0[2], torque[2], I, drag, time);
    return out;
};

/**
 * Projects a local vec3 to screen space with viewport settings
 * @param {vec3} out           - receiving vec3
 * @param {vec3} a             - local vec3
 * @param {mat4} m             - model view projection matrix
 * @param {vec4} viewport      - view port settings (x, y, width, height)
 * @returns {vec3} out         - receiving vec3 (x, y, perspectiveDivide)
 */
vec3.project = function(out, a, m, viewport)
{
    let x = a[0],
        y = a[1],
        z = a[2];

    let outX = m[0] * x + m[4] * y + m[8] * z + m[12],
        outY = m[1] * x + m[5] * y + m[9] * z + m[13],
        perD = m[3] * x + m[7] * y + m[11] * z + m[15];

    let projectionX = (outX / perD + 1) / 2;
    let projectionY = 1 - (outY / perD + 1) / 2;

    out[0] = projectionX * viewport[2] + viewport[0];
    out[1] = projectionY * viewport[3] + viewport[1];
    out[2] = perD;
    return out;
};

/**
 * Unprojects a vec3 with canvas coordinates to world space
 * @param {vec3} out            - receiving vec3
 * @param {vec3} a              - vec3 to unproject
 * @param {mat4} invViewProj    - inverse view projection matrix
 * @param {vec4|Array} viewport - [ x, y, width, height ]
 * @returns {vec3} out
 * @throw On perspective divide error
 */
vec3.unproject = (function()
{
    let vec4_0;

    return function unProject(out, a, invViewProj, viewport)
    {
        if (!vec4_0) vec4_0 = vec4.create();

        let x = a[0],
            y = a[1],
            z = a[2];

        vec4_0[0] = (x - viewport[0]) * 2.0 / viewport[2] - 1.0;
        vec4_0[1] = (y - viewport[1]) * 2.0 / viewport[3] - 1.0;
        vec4_0[2] = 2.0 * z - 1.0;
        vec4_0[3] = 1.0;

        vec4.transformMat4(vec4_0, vec4_0, invViewProj);

        if (vec4_0[3] === 0.0)
        {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            throw new Error('Perspective divide error');
        }

        out[0] = vec4_0[0] / vec4_0[3];
        out[1] = vec4_0[1] / vec4_0[3];
        out[2] = vec4_0[2] / vec4_0[3];
        return out;
    };
})();