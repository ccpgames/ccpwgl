//--------------------------------------------------------------------------------------------------------[ vec2 ]----//

vec2.fromScalar = function(s)
{
    var out = new gl3.ARRAY_TYPE(2);
    out[0] = s;
    out[1] = s;
    return out;
};

vec2.setScalar = function(out, s)
{
    out[0] = s;
    out[1] = s;
    return out;
};

vec2.fill = vec2.setScalar;

vec2.addScalar = function(out, a, s)
{
    out[0] = a[0] += s;
    out[1] = a[1] += s;
    return out;
};

vec2.subtractScalar = function(out, a, s)
{
    out[0] = a[0] -= s;
    out[1] = a[1] -= s;
    return out;
};

vec2.subScalar = vec2.subtractScalar;

vec2.multiplyScalar = function(out, a, s)
{
    if (isFinite(s))
    {
        out[0] = a[0] *= s;
        out[1] = a[1] *= s;
    }
    else
    {
        out[0] = 0;
        out[1] = 0;
    }
    return out;
};

vec2.mulScalar = vec2.multiplyScalar;

vec2.divideScalar = function(out, a, s)
{
    vec2.multiplyScalar(out, a, 1 / s);
    return out;
};

vec2.divScalar = vec2.divideScalar;

vec2.minScalar = function(out, a, s)
{
    out[0] = Math.min(a[0], s);
    out[1] = Math.min(a[1], s);
    return out;
};

vec2.maxScalar = function(out, a, s)
{
    out[0] = Math.max(a[0], s);
    out[1] = Math.max(a[1], s);
    return out;
};

vec2.fromArray = function(arr, offset)
{
    var out = new gl3.ARRAY_TYPE(2);
    offset || (offset = 0);
    out[0] = arr[offset + 0];
    out[1] = arr[offset + 1];
    return out;
}

vec2.setArray = function(out, arr, offset)
{
    if (offset === undefined) offset = 0;
    out[0] = arr[offset + 0];
    out[1] = arr[offset + 1];
    return out;
};

vec2.roundToZero = function(out, a)
{
    out[0] = (a[0] < 0) ? Math.ceil(a[0]) : Math.floor(a[0]);
    out[1] = (a[1] < 0) ? Math.ceil(a[1]) : Math.floor(a[1]);
    return out;
};

vec2.clamp = function(out, a, min, max)
{
    out[0] = Math.max(min[0], Math.min(max[0], a[0]));
    out[1] = Math.max(min[1], Math.min(max[1], a[1]));
    return out;
};

vec2.clampScalar = function(out, a, sMin, sMax)
{
    out[0] = Math.max(sMin, Math.min(sMax, a[0]));
    out[1] = Math.max(sMin, Math.min(sMax, a[1]));
    return out;
};

vec2.lengthManhattan = function(a)
{
    return Math.abs(a[0]) + Math.abs(a[1]);
};

vec2.lenMan = vec2.lengthManhattan;

vec2.fromSwizzle = function(src, width, height)
{
    var out = gl3.ARRAY_TYPE(2);
    out[0] = src[width];
    out[1] = src[height];
    return out;
}

vec2.swizzle = function(out, src, width, height)
{
    out[0] = src[width];
    out[1] = src[height];
    return out;
};

vec2.one = function()
{
    var out = gl3.ARRAY_TYPE(2);
    out[0] = 1;
    out[1] = 1;
    return out;
}

//--------------------------------------------------------------------------------------------------------[ vec3 ]----//

vec3.fromScalar = function(s)
{
    var out = new gl3.ARRAY_TYPE(3);
    out[0] = s;
    out[1] = s;
    out[2] = s;
    return out;
}

vec3.fromArray = function(arr, offset)
{
    var out = new gl3.ARRAY_TYPE(3);
    offset || (offset = 0);
    out[0] = arr[offset + 0];
    out[1] = arr[offset + 1];
    out[2] = arr[offset + 2];
    return out;
}

// TODO: Find higher precision method
vec3.setQuat = function(out, q)
{
    var qx = q[0],
        qy = q[1],
        qz = q[2],
        qw = q[3];

    var qw2 = qw * qw,
        qx2 = qx * qx,
        qy2 = qy * qy,
        qz2 = qz * qz,
        test = qx * qy + qz * qw;

    if (test > 0.499)
    {
        out[0] = 0;
        out[1] = 360 / Math.PI * Math.atan2(qx, qw);
        out[2] = 90;
        return out;
    }

    if (test < -0.499)
    {
        out[0] = 0;
        out[1] = -360 / Math.PI * Math.atan2(qx, qw);
        out[2] = -90;
        return out;
    }

    var h = Math.atan2(2 * qy * qw - 2 * qx * qz, 1 - 2 * qy2 - 2 * qz2),
        a = Math.asin(2 * qx * qy + 2 * qz * qw),
        b = Math.atan2(2 * qx * qw - 2 * qy * qz, 1 - 2 * qx2 - 2 * qz2);

    //out[0] = b * 180 / Math.PI;
    //out[1] = h * 180 / Math.PI;
    //out[2] = a * 180 / Math.PI;
    out[0] = Math.round(b * 180 / Math.PI);
    out[1] = Math.round(h * 180 / Math.PI);
    out[2] = Math.round(a * 180 / Math.PI);
    return out;
}

// TODO: Find higher precision method
vec3.fromQuat = function(q)
{
    var out = new gl3.ARRAY_TYPE(3);
    vec3.setQuat(out, q);
    return out;
}

vec3.one = function()
{
    var out = new gl3.ARRAY_TYPE(3);
    out[0] = 1;
    out[1] = 1;
    out[2] = 1;
    return out;
}

vec3.setScalar = function(out, s)
{
    out[0] = s;
    out[1] = s;
    out[2] = s;
    return out;
};

vec3.fill = vec3.setScalar;

vec3.setSpherical = function(out, radius, theta, phi)
{
    var sinPhiRadius = Math.sin(phi) * radius;
    out[0] = sinPhiRadius * Math.sin(theta);
    out[1] = Math.cos(phi) * radius;
    out[2] = sinPhiRadius * Math.cos(theta);
    return out;
}

// Possibly redundant, but more grammatically and argument(ly) correct than `mat4.getTranslation`
vec3.setTranslation = function(out, m)
{
    out[0] = m[12];
    out[1] = m[13];
    out[2] = m[14];
    return out;
}

vec3.fromTranslation = function(m)
{
    var out = new gl3.ARRAY_TYPE(3);
    out[0] = m[12];
    out[1] = m[13];
    out[2] = m[14];
    return out;
}

vec3.setScale = (function()
{
    var v;
    return function setScale(out, m)
    {
        v || (v = vec3.create());
        out[0] = vec3.length(vec3.setColumn(v, m, 0));
        out[1] = vec3.length(vec3.setColumn(v, m, 1));
        out[2] = vec3.length(vec3.setColumn(v, m, 2));
        return out;
    }
})();

vec3.setColumn = function(out, m, index)
{
    return vec3.fromArray(out, m, index * 4);
}

vec3.setArray = function(out, arr, offset)
{
    if (offset === undefined) offset = 0;
    out[0] = arr[offset + 0];
    out[1] = arr[offset + 1];
    out[2] = arr[offset + 2];
    return out;
};

// TODO: CCP shader colours aren't always linear
// TODO: Should this be moved to a color object?
vec3.fromRGB = function(rgb, unclamp)
{
    var out = new gl3.ARRAY_TYPE(3);
    out[0] = rgb[0] / 255;
    out[1] = rgb[1] / 255;
    out[2] = rgb[2] / 255;
    if (!unclamp) vec3.minScalar(out, out, 1);
    return out;
}

// TODO: CCP shader colours aren't always linear
// TODO: Should this be moved to a color object?
vec3.fromRGBValues = function(rgb, r, g, b, unclamp)
{
    var out = new gl3.ARRAY_TYPE(4);
    out[0] = r / 255;
    out[1] = g / 255;
    out[2] = b / 255;
    if (!unclamp) vec3.minScalar(out, out, 1);
    return out;
}

// TODO: CCP shader colours aren't always linear
// TODO: Should this be moved to a color object?
vec3.setRGB = function(out, rgb, unclamp)
{
    out[0] = rgb[0] / 255;
    out[1] = rgb[1] / 255;
    out[2] = rgb[2] / 255;
    if (!unclamp) vec3.minScalar(out, out, 1);
    return out;
}

// TODO: CCP shader colours aren't always linear
// TODO: Should this be moved to a color object?
vec3.setRGBValues = function(out, r, g, b, unclamp)
{
    out[0] = r / 255;
    out[1] = g / 255;
    out[2] = b / 255;
    if (!unclamp) vec3.minScalar(out, out, 1);
    return out;
}

// TODO: CCP shader colours aren't always linear
// TODO: Should this be moved to a color object?
vec3.toRGB = function(a, arr, unclamp)
{
    arr || (arr = []);
    arr[0] = Math.round(v * 255);
    arr[1] = Math.round(v * 255);
    arr[2] = Math.round(v * 255);
    if (!unclamp) vec3.minScalar(arr, arr, 255);
    return arr;
}

vec3.addScalar = function(out, a, s)
{
    out[0] = a[0] += s;
    out[1] = a[1] += s;
    out[2] = a[2] += s;
    return out;
};

vec3.subtractScalar = function(out, a, s)
{
    out[0] = a[0] -= s;
    out[1] = a[1] -= s;
    out[2] = a[2] -= s;
    return out;
};

vec3.subScalar = vec3.subtractScalar;

vec3.multiplyScalar = function(out, a, s)
{
    if (isFinite(s))
    {
        out[0] = a[0] *= s;
        out[1] = a[1] *= s;
        out[2] = a[2] *= s;
    }
    else
    {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
    }
    return out;
};

vec3.mulScalar = vec3.multiplyScalar;

vec3.divideScalar = function(out, a, s)
{
    vec3.multiplyScalar(out, a, 1 / s);
    return out;
};

vec3.divScalar = vec3.divideScalar;

vec3.minScalar = function(out, a, s)
{
    out[0] = Math.min(a[0], s);
    out[1] = Math.min(a[1], s);
    out[2] = Math.min(a[2], s);
    return out;
};

vec3.maxScalar = function(out, a, s)
{
    out[0] = Math.max(a[0], s);
    out[1] = Math.max(a[1], s);
    out[2] = Math.max(a[2], s);
    return out;
};

vec3.roundToZero = function(out, a)
{
    out[0] = (a[0] < 0) ? Math.ceil(a[0]) : Math.floor(a[0]);
    out[1] = (a[1] < 0) ? Math.ceil(a[1]) : Math.floor(a[1]);
    out[2] = (a[2] < 0) ? Math.ceil(a[2]) : Math.floor(a[2]);
    return out;
};

vec3.clamp = function(out, a, min, max)
{
    out[0] = Math.max(min[0], Math.min(max[0], a[0]));
    out[1] = Math.max(min[1], Math.min(max[1], a[1]));
    out[2] = Math.max(min[2], Math.min(max[2], a[2]));
    return out;
};

vec3.clampScalar = function(out, a, sMin, sMax)
{
    out[0] = Math.max(sMin, Math.min(sMax, a[0]));
    out[1] = Math.max(sMin, Math.min(sMax, a[1]));
    out[2] = Math.max(sMin, Math.min(sMax, a[2]));
    return out;
};

vec3.lengthManhattan = function(a)
{
    return Math.abs(a[0]) + Math.abs(a[1]) + Math.abs(a[2]);
};

vec3.lenMan = vec3.lengthManhattan;

// TODO: Test this function
vec3.transformAxisAngle = (function()
{
    var q;
    return function transformAxisAngle(out, axis, angle)
    {
        if (q === undefined) q = quat.create();
        quat.setAxisAngle(q, axis, angle);
        vec3.transformQuat(out, out, q);
        return out;
    }
})();

// TODO: Test this function
vec3.projectOnVector = function(out, a, v)
{
    return vec3.multiplyScalar(out, a, vec3.dot(v, a) / vec3.squaredLength(v));
};

vec3.projectOnPlane = (function()
{
    var v;
    return function projectOnPlane(out, a, planeNormal)
    {
        v || (v = vec3.create());
        vec3.projectOnVector(v, a, planeNormal);
        vec3.subtract(out, a, v);
        return out;
    };
})();

vec3.reflect = (function()
{
    var v;
    return function reflect(out, a, normal)
    {
        v || (v = vec3.create());
        vec3.multiplyScalar(v, normal, 2 * vec3.dot(a, normal));
        vec3.subtract(out, a, v);
        return out;
    };
})();

// TODO: Should this take an already inverted view matrix to reduce inverse calculations on multiple vec3 projects?
// TODO: Test this function
vec3.project = (function()
{
    var m;
    return function project(out, a, pMatrix, vMatrix)
    {
        m || (m = mat4.create());
        mat4.inverse(m, vMatrix)
        mat4.multiply(m, pMatrix, m);
        vec3.transformProjection(out, a, m);
        return out;
    }
})();

// TODO: Should this take an already inverted projection matrix to reduce inverse calculations on multiple vec3 unprojects?
// TODO: Test this function
vec3.unproject = (function()
{
    var m;
    return function unproject(out, a, pMatrix, vMatrix)
    {
        m || (m = mat4.create());
        mat4.inverse(m, pMatrix);
        mat4.multiply(m, vMatrix, m);
        vec3.transformProjection(out, a, m);
    }
})();

vec3.transformProjection = function(out, a, m)
{
    var x = a[0],
        y = a[1],
        z = a[2];
    var perspectiveDivide = 1 / (m[3] * x + m[7] * y + m[11] * z + m[15]);
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) * perspectiveDivide;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) * perspectiveDivide;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) * perspectiveDivide;
    return out;
};

vec3.fromSwizzle = function(src, x, y, z)
{
    var out = gl3.ARRAY_TYPE(3);
    out[0] = src[x];
    out[1] = src[y];
    out[2] = src[z];
    return out;
}

vec3.swizzle = function(out, src, x, y, z)
{
    out[0] = src[x];
    out[1] = src[y];
    out[2] = src[z];
    return out;
};



//--------------------------------------------------------------------------------------------------------[ vec4 ]----//

vec4.one = function()
{
    var out = new gl3.ARRAY_TYPE(4);
    out[0] = 1;
    out[1] = 1;
    out[2] = 1;
    out[3] = 1;
    return out;
}

vec4.fromScalar = function(s)
{
    var out = new gl3.ARRAY_TYPE(4);
    out[0] = s;
    out[1] = s;
    out[2] = s;
    out[3] = s;
    return out;
}

vec4.setScalar = function(out, s)
{
    out[0] = s;
    out[1] = s;
    out[2] = s;
    out[3] = s;
    return out;
};

vec4.fill = vec4.setScalar;

vec4.addScalar = function(out, a, s)
{
    out[0] = a[0] += s;
    out[1] = a[1] += s;
    out[2] = a[2] += s;
    out[3] = a[3] += s;
    return out;
};

vec4.subtractScalar = function(out, a, s)
{
    out[0] = a[0] -= s;
    out[1] = a[1] -= s;
    out[2] = a[2] -= s;
    out[3] = a[3] -= s;
    return out;
};

vec4.subScalar = vec4.subtractScalar;

vec4.multiplyScalar = function(out, a, s)
{
    if (isFinite(s))
    {
        out[0] = a[0] *= s;
        out[1] = a[1] *= s;
        out[2] = a[2] *= s;
        out[3] = a[3] *= s;
    }
    else
    {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
    }
    return out;
};

vec4.mulScalar = vec4.multiplyScalar;

vec4.divideScalar = function(out, a, s)
{
    vec4.multiplyScalar(out, a, 1 / s);
    return out;
};

vec4.divScalar = vec3.divideScalar;

vec4.minScalar = function(out, a, s)
{
    out[0] = Math.min(a[0], s);
    out[1] = Math.min(a[1], s);
    out[2] = Math.min(a[2], s);
    out[3] = Math.min(a[3], s);
    return out;
};

vec4.maxScalar = function(out, a, s)
{
    out[0] = Math.max(a[0], s);
    out[1] = Math.max(a[1], s);
    out[2] = Math.max(a[2], s);
    out[3] = Math.max(a[3], s);
    return out;
};

vec4.fromArray = function(arr, offset)
{
    var out = new gl3.ARRAY_TYPE(4);
    offset || (offset = 0);
    out[0] = arr[offset + 0];
    out[1] = arr[offset + 1];
    out[2] = arr[offset + 2];
    out[3] = arr[offset + 3];
    return out;
}

vec4.setArray = function(out, arr, offset)
{
    if (offset === undefined) offset = 0;
    out[0] = arr[offset + 0];
    out[1] = arr[offset + 1];
    out[2] = arr[offset + 2];
    out[3] = arr[offset + 3];
    return out;
};

// TODO: CCP shader colours aren't always linear
// TODO: Should this be moved to a color object?
vec4.fromRGB = function(rgb, unclamp)
{
    var out = new gl3.ARRAY_TYPE(4);
    out[0] = rgb[0] / 255;
    out[1] = rgb[1] / 255;
    out[2] = rgb[2] / 255;
    out[3] = 1;
    if (!unclamp) vec3.minScalar(out, out, 1);
    return out;
}

// TODO: CCP shader colours aren't always linear
// TODO: Should this be moved to a color object?
vec4.fromRGBValues = function(rgb, r, g, b, unclamp)
{
    var out = new gl3.ARRAY_TYPE(4);
    out[0] = r / 255;
    out[1] = g / 255;
    out[2] = b / 255;
    out[3] = 1;
    if (!unclamp) vec3.minScalar(out, out, 1);
    return out;
}

// TODO: CCP shader colours aren't always linear
// TODO: Should this be moved to a color object?
vec4.setRGB = function(out, rgb, unclamp)
{
    out[0] = rgb[0] / 255;
    out[1] = rgb[1] / 255;
    out[2] = rgb[2] / 255;
    out[3] = 1;
    if (!unclamp) vec3.minScalar(out, out, 1);
    return out;
}

// TODO: CCP shader colours aren't always linear
// TODO: Should this be moved to a color object?
vec4.setRGBValues = function(out, r, g, b, unclamp)
{
    out[0] = r / 255;
    out[1] = g / 255;
    out[2] = b / 255;
    out[3] = 1;
    if (!unclamp) vec3.minScalar(out, out, 1);
    return out;
}

// TODO: CCP shader colours aren't always linear
// TODO: Should this be moved to a color object?
vec4.toRGB = function(a, arr, unclamp)
{
    arr || (arr = []);
    arr[0] = Math.round(v * 255);
    arr[1] = Math.round(v * 255);
    arr[2] = Math.round(v * 255);
    if (!unclamp) vec3.minScalar(arr, arr, 255);
    return arr;
}

vec4.roundToZero = function(out, a)
{
    out[0] = (a[0] < 0) ? Math.ceil(a[0]) : Math.floor(a[0]);
    out[1] = (a[1] < 0) ? Math.ceil(a[1]) : Math.floor(a[1]);
    out[2] = (a[2] < 0) ? Math.ceil(a[2]) : Math.floor(a[2]);
    out[3] = (a[3] < 0) ? Math.ceil(a[3]) : Math.floor(a[3]);
    return out;
};

vec4.clamp = function(out, a, min, max)
{
    out[0] = Math.max(min[0], Math.min(max[0], a[0]));
    out[1] = Math.max(min[1], Math.min(max[1], a[1]));
    out[2] = Math.max(min[2], Math.min(max[2], a[2]));
    out[3] = Math.max(min[3], Math.min(max[3], a[3]));
    return out;
};

vec4.clampScalar = function(out, a, sMin, sMax)
{
    out[0] = Math.max(sMin, Math.min(sMax, a[0]));
    out[1] = Math.max(sMin, Math.min(sMax, a[1]));
    out[2] = Math.max(sMin, Math.min(sMax, a[2]));
    out[3] = Math.max(sMin, Math.min(sMax, a[3]));
    return out;
};

vec4.lengthManhattan = function(a)
{
    return Math.abs(a[0]) + Math.abs(a[1]) + Math.abs(a[2]) + Math.abs(a[3]);
};

vec4.lenMan = vec4.lengthManhattan;

vec4.fromSwizzle = function(src, x, y, z, w)
{
    var out = gl3.ARRAY_TYPE(4);
    out[0] = src[x];
    out[1] = src[y];
    out[2] = src[z];
    out[3] = src[w];
    return out;
}

vec4.swizzle = function(out, src, x, y, z, w)
{
    out[0] = src[x];
    out[1] = src[y];
    out[2] = src[z];
    out[3] = src[w];
    return out;
};

//--------------------------------------------------------------------------------------------------------[ quat ]----//

quat.zero = function()
{
    var out = new gl3.ARRAY_TYPE(4);
    return out;
};

// TODO: Find higher precision method
quat.fromVec3 = function(v)
{
    var out = new gl3.ARRAY_TYPE(4);
    quat.setVec3(out, v);
    return out;
}

// TODO: Find higher precision method
quat.setVec3 = function(out, v)
{
    var x = v[0] * Math.PI / 360,
        y = v[1] * Math.PI / 360,
        z = v[2] * Math.PI / 360;

    var c1 = Math.cos(y),
        c2 = Math.cos(z),
        c3 = Math.cos(x),
        s1 = Math.sin(y),
        s2 = Math.sin(z),
        s3 = Math.sin(x);

    // out[0] = s1 * s2 * c3 + c1 * c2 * s3;
    // out[1] = s1 * c2 * c3 + c1 * s2 * s3;
    // out[2] = c1 * s2 * c3 - s1 * c2 * s3;
    // out[3] = c1 * c2 * c3 - s1 * s2 * s3;
    out[0] = Math.round((s1 * s2 * c3 + c1 * c2 * s3) * 100000) / 100000;
    out[1] = Math.round((s1 * c2 * c3 + c1 * s2 * s3) * 100000) / 100000;
    out[2] = Math.round((c1 * s2 * c3 - s1 * c2 * s3) * 100000) / 100000;
    out[3] = Math.round((c1 * c2 * c3 - s1 * s2 * s3) * 100000) / 100000;
    return out;
}

// TODO: Test this function
quat.setUnitVectors = function(out, a, b)
{
    var r = vec3.dot(a, b) + 1;
    if (r < gl3.EPSILON)
    {
        if (Math.abs(a[0]) > Math.abs(a[2]))
        {
            quat.set(out, -a[1], a[0], 0, 0);
        }
        else
        {
            quat.set(out, 0, -a[2], a[1], 0);
        }
    }
    else
    {
        vec3.cross(out, a, b);
        out[3] = r;
    }
    return quat.normalize(out);
};

// TODO: Test this function
quat.transformVec3 = function(out, q, v)
{
    var x = v[0],
        y = v[1],
        z = v[2];

    var qx = q[0],
        qy = q[1],
        qz = q[2],
        qw = q[3];

    var ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out
};

// TODO: Should the method name be quat.fromMat4Rotation?
quat.fromMat4 = function(m)
{
    var out = new gl3.ARRAY_TYPE(4);
    return mat4.getRotation(out, m);
}

quat.fromArray = vec4.fromArray;
quat.setArray = vec4.setArray;
quat.fill = vec4.fill;
quat.one = vec3.one;

//--------------------------------------------------------------------------------------------------------[ mat3 ]----//

mat3.fromArray = function(arr, offset)
{
    var out = new gl3.ARRAY_TYPE(9);
    offset || (offset = 0);
    out[0] = arr[offset + 0];
    out[1] = arr[offset + 1];
    out[2] = arr[offset + 2];
    out[3] = arr[offset + 3];
    out[4] = arr[offset + 4];
    out[5] = arr[offset + 5];
    out[6] = arr[offset + 6];
    out[7] = arr[offset + 7];
    out[8] = arr[offset + 8];
    return out;
};

mat3.setArray = function(out, arr, offset)
{
    offset || (offset = 0);
    out[0] = arr[offset + 0];
    out[1] = arr[offset + 1];
    out[2] = arr[offset + 2];
    out[3] = arr[offset + 3];
    out[4] = arr[offset + 4];
    out[5] = arr[offset + 5];
    out[6] = arr[offset + 6];
    out[7] = arr[offset + 7];
    out[8] = arr[offset + 8];
    return out;
};

mat3.toArray = function(a, arr, offset)
{
    arr || (arr = []);
    offset || (offset = 0);
    arr[offset + 0] = a[0];
    arr[offset + 1] = a[1];
    arr[offset + 2] = a[2];
    arr[offset + 3] = a[3];
    arr[offset + 4] = a[4];
    arr[offset + 5] = a[5];
    arr[offset + 6] = a[6];
    arr[offset + 7] = a[7];
    arr[offset + 8] = a[8];
    return arr;
};

mat3.zero = function()
{
    var out = new gl3.ARRAY_TYPE(9);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    return out;
}

//--------------------------------------------------------------------------------------------------------[ mat4 ]----//

mat4.copyTranslation = function(out, m)
{
    out[12] = m[12];
    out[13] = m[13];
    out[14] = m[14];
    return out;
}

mat4.setTranslation = function(out, v)
{
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    return out;
}

// TODO: Should this be vec3.getBasisFromMat4 ?
mat4.getBasis = function(m, outX, outY, outZ)
{
    vec3.setColumn(outX, m, 0);
    vec3.setColumn(outY, m, 1);
    vec3.setColumn(outZ, m, 2);
}

mat4.fromBasis = function(vX, vY, vZ)
{
    var out = new gl3.type(16);
    out[0] = vX[0];
    out[1] = vY[0];
    out[2] = vZ[0];
    out[3] = 0;
    out[4] = vX[1];
    out[5] = vY[1];
    out[6] = vZ[1];
    out[7] = 0;
    out[8] = vX[2];
    out[9] = vY[2];
    out[10] = vY[2];
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

mat4.setBasis = function(out, vX, vY, vZ)
{
    out[0] = vX[0];
    out[1] = vY[0];
    out[2] = vZ[0];
    out[3] = 0;
    out[4] = vX[1];
    out[5] = vY[1];
    out[6] = vZ[1];
    out[7] = 0;
    out[8] = vX[2];
    out[9] = vY[2];
    out[10] = vY[2];
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

mat4.setBasisAxes = function(out, vX, vY, vZ)
{
    out[0] = vX[0];
    out[1] = vY[0];
    out[2] = vZ[0];
    out[4] = vX[1];
    out[5] = vY[1];
    out[6] = vZ[1];
    out[8] = vX[2];
    out[9] = vY[2];
    out[10] = vY[2];
    return out;
}

mat4.maxScaleOnAxis = function(m)
{
    var x = m[0] * m[0] + m[1] * m[1] + m[2] * m[2],
        y = m[4] * m[4] + m[5] * m[5] + m[6] * m[6],
        z = m[8] * m[8] + m[9] * m[9] + m[10] * m[10];
    return Math.sqrt(Math.max(x, y, z));
}

// TODO: Does the resulting quat need to be transposed (to be ccpwgl friendly)?
mat4.decompose = (function()
{
    var v, rM;
    return function decompose(m, position, quaternion, scale)
    {
        v || (v = vec3.create());
        rM || (rM = mat3.create());
        position[0] = m[12];
        position[1] = m[13];
        position[2] = m[14];
        var sx = vec3.length(vec3.set(v, m[0], m[1], m[2]));
        var sy = vec3.length(vec3.set(v, m[4], m[5], m[6]));
        var sz = vec3.length(vec3.set(v, m[8], m[9], m[10]));
        var det = mat4.determinant(m);
        if (det < 0) sx = -sx;
        scale[0] = sx;
        scale[1] = sy;
        scale[2] = sz;
        rM.set(m);
        var invSX = 1 / sx;
        var invSY = 1 / sy;
        var invSZ = 1 / sz;
        rM[0] *= invSX;
        rM[1] *= invSX;
        rM[2] *= invSX;
        rM[4] *= invSY;
        rM[5] *= invSY;
        rM[6] *= invSY;
        rM[8] *= invSZ;
        rM[9] *= invSZ;
        rM[10] *= invSZ;
        quat.fromMat3(quaternion, rM);
        quat.transpose(quaternion, quaternion);
    };
})();

mat4.fromArray = function(arr, offset)
{
    var out = new gl3.ARRAY_TYPE(16);
    offset || (offset = 0);
    out[0] = arr[offset + 0];
    out[1] = arr[offset + 1];
    out[2] = arr[offset + 2];
    out[3] = arr[offset + 3];
    out[4] = arr[offset + 4];
    out[5] = arr[offset + 5];
    out[6] = arr[offset + 6];
    out[7] = arr[offset + 7];
    out[8] = arr[offset + 8];
    out[9] = arr[offset + 9];
    out[10] = arr[offset + 10];
    out[11] = arr[offset + 11];
    out[12] = arr[offset + 12];
    out[13] = arr[offset + 13];
    out[14] = arr[offset + 14];
    out[15] = arr[offset + 15];
    return out;
}

mat4.setArray = function(out, arr, offset)
{
    offset || (offset = 0);
    out[0] = arr[offset + 0];
    out[1] = arr[offset + 1];
    out[2] = arr[offset + 2];
    out[3] = arr[offset + 3];
    out[4] = arr[offset + 4];
    out[5] = arr[offset + 5];
    out[6] = arr[offset + 6];
    out[7] = arr[offset + 7];
    out[8] = arr[offset + 8];
    out[9] = arr[offset + 9];
    out[10] = arr[offset + 10];
    out[11] = arr[offset + 11];
    out[12] = arr[offset + 12];
    out[13] = arr[offset + 13];
    out[14] = arr[offset + 14];
    out[15] = arr[offset + 15];
    return out;
}

mat4.toArray = function(a, arr, offset)
{
    arr || (arr = []);
    offset || (offset = 0);
    arr[offset + 0] = a[0];
    arr[offset + 1] = a[1];
    arr[offset + 2] = a[2];
    arr[offset + 3] = a[3];
    arr[offset + 4] = a[4];
    arr[offset + 5] = a[5];
    arr[offset + 6] = a[6];
    arr[offset + 7] = a[7];
    arr[offset + 8] = a[8];
    arr[offset + 9] = a[9];
    arr[offset + 10] = a[10];
    arr[offset + 11] = a[11];
    arr[offset + 12] = a[12];
    arr[offset + 13] = a[13];
    arr[offset + 14] = a[14];
    arr[offset + 15] = a[15];
    return arr;
}

mat4.zero = function()
{
    var out = new gl3.ARRAY_TYPE(16);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 0;
    return out;
}

mat4.setMat3 = function(out, m)
{
    out[0] = m[0];
    out[1] = m[1];
    out[2] = m[2];
    out[3] = 0;
    out[4] = m[3];
    out[5] = m[4];
    out[6] = m[5];
    out[7] = 0;
    out[8] = m[6];
    out[9] = m[7];
    out[10] = m[8];
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out
}

mat4.arcFromForward = function(out, v)
{
    var norm = new gl3.ARRAY_TYPE(3);

    var x = v[0],
        y = v[1],
        z = v[2],
        len = x * x + y * y + z * z;

    if (len > 0)
    {
        len = 1 / Math.sqrt(len);
        norm[0] = a[0] * len;
        norm[1] = a[1] * len;
        norm[2] = a[2] * len;
    }

    out[0] = out[5] = out[10] = out[15] = 1;
    out[1] = out[2] = out[3] = out[4] = 0;
    out[6] = out[7] = out[8] = out[9] = 0;
    out[11] = out[12] = out[13] = out[14] = 0;

    if (norm[2] < -0.99999) return;
    if (norm[2] > 0.99999)
    {
        out[5] = -1.0;
        out[10] = -1.0;
        return;
    }
    var h = (1 + norm[2]) / (norm[0] * norm[0] + norm[1] * norm[1]);
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

/**
 * Creates a left handed co-ordinate system perspective from a right handed
 * @param out
 * @param fovY
 * @param aspect
 * @param near
 * @param far
 */
mat4.perspectiveGL = function(out, fovY, aspect, near, far)
{
    var PI = Math.PI;
    var fW, fH;
    fH = Math.tan(fovY / 360 * PI) * near;
    fW = fH * aspect;
    mat4.frustum(out, -fW, fW, -fH, fH, near, far);
};
