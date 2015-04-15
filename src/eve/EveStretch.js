function EveStretch() {
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
}

EveStretch._tempVec3 = [vec3.create(), vec3.create(), vec3.create()];
EveStretch._tempMat4 = [mat4.create(), mat4.create()];

EveStretch.prototype.Update = function (dt) {
    for (var i = 0; i < this.curveSets.length; ++i) {
        this.curveSets[i].Update(dt);
    }
    this._time += dt;
    if (this.source) {
        this.source.GetValueAt(t, this._sourcePosition);
    }
    else if (this._useTransformsForStretch) {
        this._sourcePosition[0] = this._sourceTransform[12];
        this._sourcePosition[1] = this._sourceTransform[13];
        this._sourcePosition[2] = this._sourceTransform[14];
    }
    if (this.dest) {
        this.source.GetValueAt(t, this._destinationPosition);
    }
    var directionVec = vec3.subtract(this._destinationPosition, this._sourcePosition, EveStretch._tempVec3[0]);
    var scalingLength = vec3.length(directionVec);
    this.length.value = scalingLength;
    vec3.normalize(directionVec);
    if (this.sourceObject && this._displaySourceObject) {
        this.sourceObject.Update(dt);
    }
    if (this.stretchObject) {
        this.stretchObject.Update(dt);
    }
    if (this.destObject && this._displayDestObject) {
        this.destObject.Update(dt);
    }
}

EveStretch.prototype.UpdateViewDependentData = function () {
    if (!this.display) {
        return;
    }
    var directionVec = vec3.subtract(this._destinationPosition, this._sourcePosition, EveStretch._tempVec3[0]);
    var scalingLength = vec3.length(directionVec);
    vec3.normalize(directionVec);

    var m = EveStretch._tempMat4[0];
    if (this._useTransformsForStretch) {
        mat4.identity(m);
        mat4.rotateX(m, -Math.PI / 2);
        mat4.multiply(this._sourceTransform, m, m);
    }
    else {
        mat4.identity(m);
        var up = EveStretch._tempVec3[2];
        if (Math.abs(directionVec[1]) > 0.9) {
            up[2] = 1;
        }
        else {
            up[1] = 1;
        }
        var x = vec3.normalize(vec3.cross(up, directionVec, EveStretch._tempVec3[1]));
        vec3.cross(directionVec, x, up);
        m[0] = x[0]; m[1] = x[1]; m[2] = x[2];
        m[4] = -directionVec[0]; m[5] = -directionVec[1]; m[6] = -directionVec[2];
        m[8] = up[0]; m[9] = up[1]; m[10] = up[2];
    }
    if (this.destObject && this._displayDestObject) {
        m[12] = this._destinationPosition[0]; m[13] = this._destinationPosition[1]; m[14] = this._destinationPosition[2];
        this.destObject.UpdateViewDependentData(m);
    }
    if (this.sourceObject && this._displaySourceObject) {
        if (this._useTransformsForStretch) {
            mat4.identity(m);
            mat4.rotateX(m, -Math.PI / 2);
            mat4.multiply(this._sourceTransform, m, m);
        }
        else {
            m[12] = this._sourcePosition[0]; m[13] = this._sourcePosition[1]; m[14] = this._sourcePosition[2];
        }
        this.sourceObject.UpdateViewDependentData(m);
    }
    if (this.stretchObject) {
        if (this._useTransformsForStretch) {
            mat4.identity(m);
            mat4.scale(m, [1, 1, scalingLength]);
            mat4.multiply(this._sourceTransform, m, m);
        }
        else {
            m[0] = x[0]; m[1] = x[1]; m[2] = x[2];
            m[4] = up[0]; m[5] = up[1]; m[6] = up[2];
            m[8] = -directionVec[0]; m[9] = -directionVec[1]; m[10] = -directionVec[2];
            if (this._isNegZForward) {
                scalingLength = -scalingLength;
            }
            var s = mat4.scale(mat4.identity(EveStretch._tempMat4[1]), [1, 1, scalingLength]);
            mat4.multiply(m, s, m);
        }
        this.stretchObject.UpdateViewDependentData(m);
    }
}

EveStretch.prototype.GetBatches = function (mode, accumulator, perObjectData) {
    if (!this.display) {
        return;
    }
    if (this.sourceObject && this._displaySourceObject) {
        this.sourceObject.GetBatches(mode, accumulator, perObjectData);
    }
    if (this.destObject && this._displayDestObject) {
        this.destObject.GetBatches(mode, accumulator, perObjectData);
    }
    if (this.stretchObject) {
        this.stretchObject.GetBatches(mode, accumulator, perObjectData);
    }
};

EveStretch.prototype.SetSourcePosition = function (position) {
    this._useTransformsForStretch = false;
    this._sourcePosition = position;
}

EveStretch.prototype.SetDestinationPosition = function (position) {
    this._destinationPosition = position;
}

EveStretch.prototype.SetSourceTransform = function (transform) {
    this._useTransformsForStretch = true;
    this._sourceTransform = transform;
}

EveStretch.prototype.SetIsNegZForward = function (isNegZForward) {
    this._isNegZForward = isNegZForward;
}
