/**
 * EveStretch
 * @property {String} name
 * @property {boolean} display
 * @property {boolean} update
 * @property source
 * @property dest
 * @property sourceObject
 * @property destObject
 * @property {Array.<CurveSets>} curveSets
 * @property {Tw2Float} length
 * @property {number} _time
 * @property {boolean} _useTransformsForStretch
 * @property {vec3} _sourcePosition
 * @property {vec3} _destinationPosition
 * @property {boolean} _displaySourceObject
 * @property {mat4} _sourceTransform
 * @property {boolean} _displayDestObject
 * @property {boolean} _useTransformsForStretch
 * @property {boolean} _isNegZForward
 * @constructor
 */
function EveStretch()
{
    this.name = '';
    this.display = true;
    this.update = true;
    this.source = null;
    this.dest = null;
    this.sourceObject = null;
    this.destObject = null;
    this.stretchObject = null;
    this.curveSets = [];
    this.length = new Tw2Float();
    this._time = 0;
    this._useTransformsForStretch = false;
    this._sourcePosition = vec3.create();
    this._destinationPosition = vec3.create();
    this._displaySourceObject = true;
    this._sourceTransform = null;
    this._displayDestObject = true;
    this._useTransformsForStretch = false;
    this._isNegZForward = false;

    var scratch = EveStretch.scratch;
    if (!scratch.vec3_0)
    {
        scratch.vec3_0 = vec3.create();
        scratch.vec3_1 = vec3.create();
        scratch.vec3_2 = vec3.create();
        scratch.mat4_0 = mat4.create();
        scratch.mat4_1 = mat4.create();
    }
}

/**
 * Scratch variables
 */
EveStretch.scratch = {
    vec3_0 : null,
    vec3_1 : null,
    vec3_2 : null,
    mat4_0 : null,
    mat4_1 : null
};

/**
 * Per frame update
 * @param {number} dt - delta time
 */
EveStretch.prototype.Update = function (dt)
{
    for (var i = 0; i < this.curveSets.length; ++i)
    {
        this.curveSets[i].Update(dt);
    }
    this._time += dt;
    if (this.source)
    {
        this.source.GetValueAt(this._time, this._sourcePosition);
    }
    else if (this._useTransformsForStretch)
    {
        this._sourcePosition[0] = this._sourceTransform[12];
        this._sourcePosition[1] = this._sourceTransform[13];
        this._sourcePosition[2] = this._sourceTransform[14];
    }
    if (this.dest)
    {
        this.source.GetValueAt(this._time, this._destinationPosition);
    }

    var directionVec = vec3.subtract(EveStretch.scratch.vec3_0, this._destinationPosition, this._sourcePosition);
    this.length.value = vec3.length(directionVec);
    vec3.normalize(directionVec, directionVec);

    if (this.sourceObject && this._displaySourceObject)
    {
        this.sourceObject.Update(dt);
    }
    if (this.stretchObject)
    {
        this.stretchObject.Update(dt);
    }
    if (this.destObject && this._displayDestObject)
    {
        this.destObject.Update(dt);
    }
};

/**
 * Updates view dependent data
 */
EveStretch.prototype.UpdateViewDependentData = function ()
{
    if (!this.display)
    {
        return;
    }

    var scratch = EveStretch.scratch;
    var directionVec = vec3.subtract(scratch.vec3_0, this._destinationPosition, this._sourcePosition);
    var scalingLength = vec3.length(directionVec);
    vec3.normalize(directionVec, directionVec);

    var m = mat4.identity(scratch.mat4_0),
        x = vec3.set(scratch.vec3_1, 0, 0, 0),
        up = vec3.set(scratch.vec3_2, 0, 0, 0);

    if (this._useTransformsForStretch)
    {
        mat4.rotateX(m, m, -Math.PI / 2);
        mat4.multiply(m, this._sourceTransform, m);
    }
    else
    {
        if (Math.abs(directionVec[1]) > 0.9)
        {
            up[2] = 1;
        }
        else
        {
            up[1] = 1;
        }
        vec3.cross(x, up, directionVec);
        vec3.normalize(x, x);
        vec3.cross(up, directionVec, x);
        m[0] = x[0];
        m[1] = x[1];
        m[2] = x[2];
        m[4] = -directionVec[0];
        m[5] = -directionVec[1];
        m[6] = -directionVec[2];
        m[8] = up[0];
        m[9] = up[1];
        m[10] = up[2];
    }
    if (this.destObject && this._displayDestObject)
    {
        m[12] = this._destinationPosition[0];
        m[13] = this._destinationPosition[1];
        m[14] = this._destinationPosition[2];
        this.destObject.UpdateViewDependentData(m);
    }
    if (this.sourceObject && this._displaySourceObject)
    {
        if (this._useTransformsForStretch)
        {
            mat4.identity(m);
            mat4.rotateX(m, m, -Math.PI / 2);
            mat4.multiply(m, this._sourceTransform, m);
        }
        else
        {
            m[12] = this._sourcePosition[0];
            m[13] = this._sourcePosition[1];
            m[14] = this._sourcePosition[2];
        }
        this.sourceObject.UpdateViewDependentData(m);
    }
    if (this.stretchObject)
    {
        if (this._useTransformsForStretch)
        {
            mat4.identity(m);
            mat4.scale(m, m, [1, 1, scalingLength]);
            mat4.multiply(m, this._sourceTransform, m);
        }
        else
        {
            m[0] = x[0];
            m[1] = x[1];
            m[2] = x[2];
            m[4] = up[0];
            m[5] = up[1];
            m[6] = up[2];
            m[8] = -directionVec[0];
            m[9] = -directionVec[1];
            m[10] = -directionVec[2];
            if (this._isNegZForward)
            {
                scalingLength = -scalingLength;
            }
            var s = mat4.identity(scratch.mat4_1);
            mat4.scale(s, s, [1, 1, scalingLength]);
            mat4.multiply(m, m, s);
        }
        this.stretchObject.UpdateViewDependentData(m);
    }
};

/**
 * Gets render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 */
EveStretch.prototype.GetBatches = function (mode, accumulator, perObjectData)
{
    if (!this.display)
    {
        return;
    }
    if (this.sourceObject && this._displaySourceObject)
    {
        this.sourceObject.GetBatches(mode, accumulator, perObjectData);
    }
    if (this.destObject && this._displayDestObject)
    {
        this.destObject.GetBatches(mode, accumulator, perObjectData);
    }
    if (this.stretchObject)
    {
        this.stretchObject.GetBatches(mode, accumulator, perObjectData);
    }
};

/**
 * Gets source position
 * @param {vec3} position
 */
EveStretch.prototype.SetSourcePosition = function (position)
{
    this._useTransformsForStretch = false;
    this._sourcePosition = position;
};

/**
 * Sets the destination position
 * @param {vec3} position
 */
EveStretch.prototype.SetDestinationPosition = function (position)
{
    this._destinationPosition = position;
};

/**
 * Sets the source transform
 * @param {mat4} transform
 */
EveStretch.prototype.SetSourceTransform = function (transform)
{
    this._useTransformsForStretch = true;
    this._sourceTransform = transform;
};

/**
 * SetIsNegZForward
 * @param {boolean} isNegZForward
 */
EveStretch.prototype.SetIsNegZForward = function (isNegZForward)
{
    this._isNegZForward = isNegZForward;
};
