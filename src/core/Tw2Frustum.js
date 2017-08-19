/**
 * Tw2Frustum
 * @property {Array.<vec4>} planes
 * @property {vec3} viewPos
 * @property {vec3} viewDir
 * @property {number} halfWidthProjection
 * @constructor
 */
function Tw2Frustum()
{
    this.planes = [vec4.create(), vec4.create(), vec4.create(), vec4.create(), vec4.create(), vec4.create()];
    this.viewPos = vec3.create();
    this.viewDir = vec3.create();
    this.halfWidthProjection = 1;
}

/**
 * Scratch variables
 */
Tw2Frustum.scratch = {
    mat4_0 : mat4.create(),
    vec3_0 : vec3.create()
};

/**
 * Initializes the Tw2Frustum
 * @param {mat4} view - View Matrix
 * @param {mat4} proj - Projection Matrix
 * @param {number} viewportSize
 * @param {mat4} [viewInverse] Optional viewInverse matrix
 * @param {mat4} [viewProjection] Optional viewProjection matrix
 * @prototype
 */
Tw2Frustum.prototype.Initialize = function(view, proj, viewportSize, viewInverse, viewProjection)
{
    var mat4_0 = Tw2Frustum.scratch.mat4_0;

    var viewInv = viewInverse ? viewInverse : mat4.invert(mat4_0, view);
    this.viewPos.set(viewInv.subarray(12, 14));
    this.viewDir.set(viewInv.subarray(8, 10));
    this.halfWidthProjection = proj[0] * viewportSize * 0.5;

    var viewProj = viewProjection ? viewProjection : mat4.multiply(mat4_0, proj, view);
    this.planes[0][0] = viewProj[2];
    this.planes[0][1] = viewProj[6];
    this.planes[0][2] = viewProj[10];
    this.planes[0][3] = viewProj[14];

    this.planes[1][0] = viewProj[3] + viewProj[0];
    this.planes[1][1] = viewProj[7] + viewProj[4];
    this.planes[1][2] = viewProj[11] + viewProj[8];
    this.planes[1][3] = viewProj[15] + viewProj[12];

    this.planes[2][0] = viewProj[3] - viewProj[1];
    this.planes[2][1] = viewProj[7] - viewProj[5];
    this.planes[2][2] = viewProj[11] - viewProj[9];
    this.planes[2][3] = viewProj[15] - viewProj[13];

    this.planes[3][0] = viewProj[3] - viewProj[0];
    this.planes[3][1] = viewProj[7] - viewProj[4];
    this.planes[3][2] = viewProj[11] - viewProj[8];
    this.planes[3][3] = viewProj[15] - viewProj[12];

    this.planes[4][0] = viewProj[3] + viewProj[1];
    this.planes[4][1] = viewProj[7] + viewProj[5];
    this.planes[4][2] = viewProj[11] + viewProj[9];
    this.planes[4][3] = viewProj[15] + viewProj[13];

    this.planes[5][0] = viewProj[3] - viewProj[2];
    this.planes[5][1] = viewProj[7] - viewProj[6];
    this.planes[5][2] = viewProj[11] - viewProj[10];
    this.planes[5][3] = viewProj[15] - viewProj[14];

    for (var i = 0; i < 6; ++i)
    {
        var len = vec3.length(this.planes[i]);
        this.planes[i][0] /= len;
        this.planes[i][1] /= len;
        this.planes[i][2] /= len;
        this.planes[i][3] /= len;
    }
};

/**
 * Checks to see if a sphere is visible within the frustum
 * @param {vec3} center
 * @param {number} radius
 * @returns {boolean}
 * @prototype
 */
Tw2Frustum.prototype.IsSphereVisible = function(center, radius)
{
    for (var i = 0; i < 6; ++i)
    {
        if (this.planes[i][0] * center[0] + this.planes[i][1] * center[1] + this.planes[i][2] * center[2] + this.planes[i][3] < -radius)
        {
            return false;
        }
    }
    return true;
};

/**
 * GetPixelSizeAcross
 * @param {vec3} center
 * @param {number} radius
 * @returns {number}
 * @prototype
 */
Tw2Frustum.prototype.GetPixelSizeAcross = function(center, radius)
{
    var d = vec3.subtract(Tw2Frustum.scratch.vec3_0, this.viewPos, center);
    var depth = vec3.dot(this.viewDir, d);
    var epsilon = 1e-5;
    if (depth < epsilon)
    {
        depth = epsilon;
    }
    if (radius < epsilon)
    {
        return 0;
    }
    var ratio = radius / depth;
    return ratio * this.halfWidthProjection * 2;
};
