import {mat4, vec3} from 'gl-matrix';
export {mat4};

/**
 * arcFromForward
 * @param {mat4} out
 * @param {vec3} v
 * @return {mat4} out
 */
mat4.arcFromForward = (function()
{
    let vec3_0;

    return function arcFromForward(out, v)
    {
        if (!vec3_0) vec3_0 = vec3.create();

        const norm = vec3.normalize(vec3_0, v);
        mat4.identity(out);

        if (norm[2] < -0.99999) 
        {
            return out;
        }

        if (norm[2] > 0.99999)
        {
            out[5] = -1.0;
            out[10] = -1.0;
            return out;
        }

        const h = (1 + norm[2]) / (norm[0] * norm[0] + norm[1] * norm[1]);
        out[0] = h * norm[1] * norm[1] - norm[2];
        out[1] = -h * norm[0] * norm[1];
        out[2] = norm[0];

        out[4] = out[1];
        out[5] = h * norm[0] * norm[0] - norm[2];
        out[6] = norm[1];

        out[8] = -norm[0];
        out[9] = -norm[1];
        out[10] = -norm[2];

        return out;
    };
})();

/**
 * Copies the translation component from one mat4 to another
 * @param {mat4} out
 * @param {mat4} a
 * @returns {mat4} out
 */
mat4.copyTranslation = function(out, a)
{
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    return out;
};

/**
 * Sets a mat4 from a mat4
 * @param {mat4} out
 * @param {mat3} m
 * @returns {mat4} out
 */
mat4.fromMat3 = function(out, m)
{
    out[0] = m[0];
    out[1] = m[1];
    out[2] = m[2];
    out[4] = m[3];
    out[5] = m[4];
    out[6] = m[5];
    out[8] = m[6];
    out[9] = m[7];
    out[10] = m[8];
    out[3] = out[7] = out[11] = out[12] = out[13] = out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis from a left handed coordinate system
 *
 * @param {mat4} out - mat4 frustum matrix will be written into
 * @param {vec3} eye - Position of the viewer
 * @param {vec3} center - Point the viewer is looking at
 * @param {vec3} up - vec3 pointing up
 * @returns {mat4} out
 */
mat4.lookAtGL = (function ()
{
    let vec3_0, vec3_1, vec3_2;

    return function lookAtGL(out, eye, center, up)
    {
        if (!vec3_0)
        {
            vec3_0 = vec3.create();
            vec3_1 = vec3.create();
            vec3_2 = vec3.create();
        }

        vec3.subtract(vec3_2, eye, center);

        if (vec3.squaredLength(vec3_2) === 0)
        {
            vec3_2[2] = 1;
        }

        vec3.normalize(vec3_2, vec3_2);
        vec3.cross(vec3_0, up, vec3_2);

        if (vec3.squaredLength(vec3_0) === 0)
        {
            vec3_2[2] += 0.0001;
            vec3.cross(vec3_0, up, vec3_2);
        }

        vec3.normalize(vec3_0, vec3_0);
        vec3.cross(vec3_1, vec3_2, vec3_0);

        out[0] = vec3_0[0];
        out[1] = vec3_0[1];
        out[2] = vec3_0[2];

        out[4] = vec3_1[0];
        out[5] = vec3_1[1];
        out[6] = vec3_1[2];

        out[8] = vec3_2[0];
        out[9] = vec3_2[1];
        out[10] = vec3_2[2];

        return out;
    };
})();

/**
 * Sets a left handed co-ordinate system perspective from a right handed co-ordinate system
 * @param {mat4} out        - receiving mat4
 * @param {number} fovY     - Vertical field of view in radians
 * @param {number} aspect   - Aspect ratio. typically viewport width/height
 * @param {number} near     - Near bound of the frustum
 * @param {number} far      - Far bound of the frustum
 * @returns {mat4} out      - receiving mat4
 */
mat4.perspectiveGL = function(out, fovY, aspect, near, far)
{
    let fH = Math.tan(fovY / 360 * Math.PI) * near;
    let fW = fH * aspect;
    mat4.frustum(out, -fW, fW, -fH, fH, near, far);
};

/**
 * Sets the translation component of a mat4 from a vec3
 * @param {mat4} out
 * @param {vec3} v
 * @returns {mat4} out
 */
mat4.setTranslation = function(out, v)
{
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    return out;
};

/**
 * Sets the translation component of a mat4 from values
 * @param {mat4} out
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {mat4} out
 */
mat4.setTranslationFromValues = function(out, x, y, z)
{
    out[12] = x;
    out[13] = y;
    out[14] = z;
    return out;
};