/**
 * EveTurretData
 * @property {String} name
 * @property {boolean} visible
 * @property {mat4} localTransform
 * @property {quat4} rotation
 * @constructor
 */
function EveTurretData()
{
    this.name = '';
    this.visible = true;
    this.localTransform = mat4.create();
    this.rotation = quat4.create();
}

/**
 * EveTurretSet
 * @property {boolean} display
 * @property {string} name
 * @property {quat4} boundingSphere
 * @property {number} bottomClipHeight
 * @property {string} locatorName
 * @property {Tw2Effect} turretEffect
 * @property {vec3} targetPosition
 * @property {number} sysBoneHeight
 * @property {string} firingEffectResPath
 * @property {EveTurretFiringFx} firingEffect
 * @property {boolean} hasCyclingFiringPos
 * @property {string} geometryResPath
 * @property {Tw2GeometryRes} geometryResource
 * @property {Tw2AnimationController} activeAnimation
 * @property {Tw2AnimationController} inactiveAnimation
 * @property {mat4} parentMatrix
 * @property {Array.<EveTurretData>} turrets
 * @property {number} STATE_INACTIVE
 * @property {number} STATE_IDLE
 * @property {number} STATE_FIRING
 * @property {number} STATE_PACKING
 * @property {number} STATE_UNPACKING
 * @property {number} state

 * @property {Tw2PerObjectData} _perObjectDataActive
 * @property {Tw2PerObjectData} _perObjectDataInactive
 * @property {Array.<string>} worldNames
 * @property {number} _activeTurret
 * @property {number} _recheckTimeLeft
 * @property {number} _currentCyclingFiresPos
 * @constructor
 */
function EveTurretSet()
{
    this.display = true;
    this.name = '';
    this.boundingSphere = quat4.create();
    this.bottomClipHeight = 0;
    this.locatorName = '';
    this.sysBoneHeight = 0;

    this.turrets = [];
    this.turretEffect = null;
    this.targetPosition = vec3.create();
    this.firingEffectResPath = '';
    this.firingEffect = null;
    this.fireCallback = null;
    this.fireCallbackPending = false;

    this.hasCyclingFiringPos = false;
    this.geometryResPath = '';
    this.geometryResource = null;

    this.activeAnimation = new Tw2AnimationController();
    this.inactiveAnimation = new Tw2AnimationController();

    this.parentMatrix = mat4.identity(mat4.create());

    this.STATE_INACTIVE = 0;
    this.STATE_IDLE = 1;
    this.STATE_FIRING = 2;
    this.STATE_PACKING = 3;
    this.STATE_UNPACKING = 4;

    this.state = this.STATE_IDLE;

    this._perObjectDataActive = new Tw2PerObjectData();
    this._perObjectDataActive.perObjectVSData = new Tw2RawData();
    this._perObjectDataActive.perObjectVSData.Declare('baseCutoffData', 4);
    this._perObjectDataActive.perObjectVSData.Declare('turretSetData', 4);
    this._perObjectDataActive.perObjectVSData.Declare('shipMatrix', 16);
    this._perObjectDataActive.perObjectVSData.Declare('turretTranslation', 4 * 24);
    this._perObjectDataActive.perObjectVSData.Declare('turretRotation', 4 * 24);
    this._perObjectDataActive.perObjectVSData.Declare('turretPoseTransAndRot', 2 * 4 * 72);
    this._perObjectDataActive.perObjectVSData.Create();

    this._perObjectDataInactive = new Tw2PerObjectData();
    this._perObjectDataInactive.perObjectVSData = new Tw2RawData();
    this._perObjectDataInactive.perObjectVSData.Declare('baseCutoffData', 4);
    this._perObjectDataInactive.perObjectVSData.Declare('turretSetData', 4);
    this._perObjectDataInactive.perObjectVSData.Declare('shipMatrix', 16);
    this._perObjectDataInactive.perObjectVSData.Declare('turretTranslation', 4 * 24);
    this._perObjectDataInactive.perObjectVSData.Declare('turretRotation', 4 * 24);
    this._perObjectDataInactive.perObjectVSData.Declare('turretPoseTransAndRot', 2 * 4 * 72);
    this._perObjectDataInactive.perObjectVSData.Create();

    this.worldNames = ['turretWorld0', 'turretWorld1', 'turretWorld2'];

    this._activeTurret = -1;
    this._recheckTimeLeft = 0;
    this._currentCyclingFiresPos = 0;
}

/**
 * Bone Skeleton Names
 * @type {string[]}
 */
EveTurretSet.positionBoneSkeletonNames = [
    "Pos_Fire01",
    "Pos_Fire02",
    "Pos_Fire03",
    "Pos_Fire04",
    "Pos_Fire05",
    "Pos_Fire06",
    "Pos_Fire07",
    "Pos_Fire08"
];

/**
 * Initializes the Turret Set
 */
EveTurretSet.prototype.Initialize = function()
{
    if (this.turretEffect && this.geometryResPath != '')
    {
        this.geometryResource = resMan.GetResource(this.geometryResPath);
        this.activeAnimation.SetGeometryResource(this.geometryResource);
        this.inactiveAnimation.SetGeometryResource(this.geometryResource);
        if (this.geometryResource)
        {
            this.geometryResource.RegisterNotification(this);
        }
    }
    if (this.firingEffectResPath != '')
    {
        var self = this;
        resMan.GetObject(this.firingEffectResPath, function(object)
        {
            self.firingEffect = object;
        });
    }
};

/**
 * Gets turret set res objects
 * @param {Array} [out=[]] - Optional receiving array
 * @returns {Array.<Tw2EffectRes|Tw2TextureRes|Tw2GeometryRes>} [out]
 */
EveTurretSet.prototype.GetResources = function(out)
{
    if (out === undefined)
    {
        out = [];
    }

    if (this.geometryResource !== null)
    {
        if (out.indexOf(this.geometryResource) === -1)
        {
            out.push(this.geometryResource);
        }
    }

    if (this.turretEffect !== null)
    {
        this.turretEffect.GetResources(out);
    }

    if (this.firingEffect !== null)
    {
        this.firingEffect.GetResources(out);
    }

    return out;
}

/**
 * Rebuilds the turret sets cached data
 */
EveTurretSet.prototype.RebuildCachedData = function()
{
    var instancedElement = new Tw2VertexElement(Tw2VertexDeclaration.DECL_TEXCOORD, 1, device.gl.FLOAT, 2);
    for (var i = 0; i < this.geometryResource.meshes.length; ++i)
    {
        this.geometryResource.meshes[i].declaration.elements.push(instancedElement);
        this.geometryResource.meshes[i].declaration.RebuildHash();
    }
    var self = this;
    switch (this.state)
    {
        case this.STATE_INACTIVE:
            this.activeAnimation.PlayAnimation("Inactive", true);
            this.inactiveAnimation.PlayAnimation("Inactive", true);
            break;
        case this.STATE_IDLE:
            this.activeAnimation.PlayAnimation("Active", true);
            this.inactiveAnimation.PlayAnimation("Active", true);
            break;
        case this.STATE_FIRING:
            this.activeAnimation.PlayAnimation("Fire", false, function()
            {
                self.activeAnimation.PlayAnimation("Active", true);
            });
            this.inactiveAnimation.PlayAnimation("Active", true);
            break;
        case this.STATE_PACKING:
            this.EnterStateIdle();
            break;
        case this.STATE_UNPACKING:
            this.EnterStateDeactive();
            break;
    }
};

/**
 * Initializes turret set firing effect
 */
EveTurretSet.prototype.InitializeFiringEffect = function()
{
    if (!this.firingEffect)
    {
        return;
    }
    if (this.geometryResource && this.geometryResource.models.length)
    {
        var model = this.geometryResource.models[0];
        for (var i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
        {
            this.firingEffect.SetMuzzleBoneID(i, model.FindBoneByName(EveTurretSet.positionBoneSkeletonNames[i]));
        }
    }
};

/**
 * Sets the local transform for a specific turret index
 * @param {number} index
 * @param {mat4} localTransform
 * @param {String} locatorName
 */
EveTurretSet.prototype.SetLocalTransform = function(index, localTransform, locatorName)
{
    var transform = mat4.create(localTransform);
    vec3.normalize(transform.subarray(0, 3));
    vec3.normalize(transform.subarray(4, 7));
    vec3.normalize(transform.subarray(8, 11));
    if (index >= this.turrets.length)
    {
        var data = new EveTurretData();
        data.name = locatorName;
        data.localTransform.set(transform);
        this.turrets[index] = data;
    }
    else
    {
        this.turrets[index].localTransform.set(transform);
    }
    mat4toquat(this.turrets[index].localTransform, this.turrets[index].rotation);
};

function mat3x4toquat(mm, index, out, outIndex)
{
    index *= 12;
    outIndex *= 4;
    var m = mat3x4toquat._tempMat;
    m[0] = mm[index + 0];
    m[1] = mm[index + 4];
    m[2] = mm[index + 8];
    m[3] = 0;
    m[4] = mm[index + 1];
    m[5] = mm[index + 5];
    m[6] = mm[index + 9];
    m[7] = 0;
    m[8] = mm[index + 2];
    m[9] = mm[index + 6];
    m[10] = mm[index + 10];
    m[11] = 0;
    m[12] = mm[index + 3];
    m[13] = mm[index + 7];
    m[14] = mm[index + 11];
    m[15] = 1;
    var q = mat3x4toquat._tempQuat;
    mat4toquat(m, q);
    out[outIndex] = q[0];
    out[outIndex + 1] = q[1];
    out[outIndex + 2] = q[2];
    out[outIndex + 3] = q[3];
}

mat3x4toquat._tempMat = mat4.create();
mat3x4toquat._tempQuat = quat4.create();


function mat4toquat(m, out)
{
    out = out || quat4.create();
    var trace = m[0] + m[5] + m[10] + 1.0;
    if (trace > 1.0)
    {
        out[0] = (m[6] - m[9]) / (2.0 * Math.sqrt(trace));
        out[1] = (m[8] - m[2]) / (2.0 * Math.sqrt(trace));
        out[2] = (m[1] - m[4]) / (2.0 * Math.sqrt(trace));
        out[3] = Math.sqrt(trace) / 2.0;
        return out;
    }
    var maxi = 0;
    var maxdiag = m[0];
    for (var i = 1; i < 3; i++)
    {
        if (m[i * 4 + i] > maxdiag)
        {
            maxi = i;
            maxdiag = m[i * 4 + i];
        }
    }
    var S;
    switch (maxi)
    {
        case 0:
            S = 2.0 * Math.sqrt(1.0 + m[0] - m[5] - m[10]);
            out[0] = 0.25 * S;
            out[1] = (m[1] + m[4]) / S;
            out[2] = (m[2] + m[8]) / S;
            out[3] = (m[6] - m[9]) / S;
            break;
        case 1:
            S = 2.0 * Math.sqrt(1.0 + m[5] - m[0] - m[10]);
            out[0] = (m[1] + m[4]) / S;
            out[1] = 0.25 * S;
            out[2] = (m[6] + m[9]) / S;
            out[3] = (m[8] - m[2]) / S;
            break;
        case 2:
            S = 2.0 * Math.sqrt(1.0 + m[10] - m[0] - m[5]);
            out[0] = (m[2] + m[8]) / S;
            out[1] = (m[6] + m[9]) / S;
            out[2] = 0.25 * S;
            out[3] = (m[1] - m[4]) / S;
            break;
    }
    return out;
}

/**
 * Updates per object data
 * @param {Tw2PerObjectData} perObjectData
 * @param transforms
 * @private
 */
EveTurretSet.prototype._UpdatePerObjectData = function(perObjectData, transforms)
{
    mat4.transpose(this.parentMatrix, perObjectData.Get('shipMatrix'));
    var transformCount = transforms.length / 12;
    perObjectData.Get('turretSetData')[0] = transformCount;
    perObjectData.Get('baseCutoffData')[0] = this.bottomClipHeight;
    var translation = perObjectData.Get('turretTranslation');
    var rotation = perObjectData.Get('turretRotation');
    var pose = perObjectData.Get('turretPoseTransAndRot');
    for (var i = 0; i < this.turrets.length; ++i)
    {
        for (var j = 0; j < transformCount; ++j)
        {
            pose[(i * transformCount + j) * 2 * 4] = transforms[j * 12 + 3];
            pose[(i * transformCount + j) * 2 * 4 + 1] = transforms[j * 12 + 7];
            pose[(i * transformCount + j) * 2 * 4 + 2] = transforms[j * 12 + 11];
            pose[(i * transformCount + j) * 2 * 4 + 3] = 1;
            mat3x4toquat(transforms, j, pose, (i * transformCount + j) * 2 + 1);
        }
        translation[i * 4] = this.turrets[i].localTransform[12];
        translation[i * 4 + 1] = this.turrets[i].localTransform[13];
        translation[i * 4 + 2] = this.turrets[i].localTransform[14];
        translation[i * 4 + 3] = 1;
        rotation[i * 4] = this.turrets[i].rotation[0];
        rotation[i * 4 + 1] = this.turrets[i].rotation[1];
        rotation[i * 4 + 2] = this.turrets[i].rotation[2];
        rotation[i * 4 + 3] = this.turrets[i].rotation[3];
    }
};

/**
 * Gets turret set render batches
 * @param {RenderMode} mode
 * @param {Tw2BatchAccumulator} accumulator
 * @param {Tw2PerObjectData} perObjectData
 * @returns {boolean}
 */
EveTurretSet.prototype.GetBatches = function(mode, accumulator, perObjectData)
{
    if (!this.turretEffect || this.geometryResource == null || !this.display)
    {
        return false;
    }
    if (mode == device.RM_OPAQUE)
    {
        var transforms = this.inactiveAnimation.GetBoneMatrixes(0);
        if (transforms.length == 0)
        {
            return true;
        }
        this._UpdatePerObjectData(this._perObjectDataInactive.perObjectVSData, transforms);
        this._perObjectDataInactive.perObjectPSData = perObjectData.perObjectPSData;

        var batch = new Tw2ForwardingRenderBatch();
        batch.renderMode = mode;
        batch.renderActive = false;
        batch.perObjectData = this._perObjectDataInactive;
        batch.geometryProvider = this;
        accumulator.Commit(batch);

        if (this.state == this.STATE_FIRING)
        {
            transforms = this.activeAnimation.GetBoneMatrixes(0);
            if (transforms.length == 0)
            {
                return true;
            }
            this._UpdatePerObjectData(this._perObjectDataActive.perObjectVSData, transforms);
            this._perObjectDataActive.perObjectPSData = perObjectData.perObjectPSData;

            batch = new Tw2ForwardingRenderBatch();
            batch.renderActive = true;
            batch.perObjectData = this._perObjectDataActive;
            batch.geometryProvider = this;
            accumulator.Commit(batch);
        }
    }
    if (this.firingEffect)
    {
        this.firingEffect.GetBatches(mode, accumulator, perObjectData);
    }
    return true;
};

/**
 * Per frame update
 * @param {number} dt - Delta Time
 * @param {mat4} parentMatrix
 */
EveTurretSet.prototype.Update = function(dt, parentMatrix)
{
    if (this.turretEffect)
    {
        this.activeAnimation.Update(dt);
        this.inactiveAnimation.Update(dt);
    }
    mat4.set(parentMatrix, this.parentMatrix);
    if (this.firingEffect)
    {
        if (this._activeTurret != -1)
        {
            if (this.firingEffect.isLoopFiring)
            {
                if (this.state == this.STATE_FIRING)
                {
                    this._recheckTimeLeft -= dt;
                    if (this._recheckTimeLeft <= 0)
                    {
                        this._DoStartFiring();
                    }
                }
            }
            var i;
            if (this.activeAnimation.models.length)
            {
                var bones = this.activeAnimation.models[0].bonesByName;
                for (i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
                {
                    var transform = bones[EveTurretSet.positionBoneSkeletonNames[i]].worldTransform;
                    var out = this.firingEffect.GetMuzzleTransform(i);
                    mat4.multiply(parentMatrix, mat4.multiply(this.turrets[this._activeTurret].localTransform, transform, out), out);
                }
            }
            else
            {
                for (i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
                {
                    mat4.multiply(parentMatrix, this.turrets[this._activeTurret].localTransform, this.firingEffect.GetMuzzleTransform(i));
                }
            }
            if (this.fireCallbackPending)
            {
                if (this.fireCallback)
                {
                    var cbTransforms = [];
                    for (i = 0; i < this.firingEffect.GetPerMuzzleEffectCount(); ++i)
                    {
                        cbTransforms.push(this.firingEffect.GetMuzzleTransform(i));
                    }
                    this.fireCallback(this, cbTransforms);
                }
                this.fireCallbackPending = false;
            }
        }

        vec3.set(this.targetPosition, this.firingEffect.endPosition);
        this.firingEffect.Update(dt);
    }
};

/**
 * Renders the turret set
 * @param batch
 * @param {Tw2Effect} overrideEffect
 */
EveTurretSet.prototype.Render = function(batch, overrideEffect)
{
    var effect = (!overrideEffect) ? this.turretEffect : overrideEffect;
    var index = 0;
    var customSetter = function(el)
    {
        device.gl.disableVertexAttribArray(el.location);
        device.gl.vertexAttrib2f(el.location, index, index);
    };
    for (var i = 0; i < this.geometryResource.meshes.length; ++i)
    {
        var decl = this.geometryResource.meshes[i].declaration;
        decl.FindUsage(Tw2VertexDeclaration.DECL_TEXCOORD, 1).customSetter = customSetter;
    }
    for (; index < this.turrets.length; ++index)
    {
        if (this.turrets[index].visible)
        {
            var isActive = this.state == this.STATE_FIRING && index == this._activeTurret;
            if (batch.renderActive == isActive)
            {
                this.geometryResource.RenderAreas(0, 0, 1, effect);
            }
        }
    }
};

/**
 * Animation helper function for deactivating a turret set
 */
EveTurretSet.prototype.EnterStateDeactive = function()
{
    if (this.state == this.STATE_INACTIVE || this.state == this.STATE_PACKING)
    {
        return;
    }
    var self = this;
    if (this.turretEffect)
    {
        this.activeAnimation.StopAllAnimations();
        this.inactiveAnimation.StopAllAnimations();
        this.activeAnimation.PlayAnimation("Pack", false, function()
        {
            self.state = self.STATE_INACTIVE;
            self.activeAnimation.PlayAnimation("Inactive", true);
        });
        this.inactiveAnimation.PlayAnimation("Pack", false, function()
        {
            self.state = self.STATE_INACTIVE;
            self.inactiveAnimation.PlayAnimation("Inactive", true);
        });
        this.state = this.STATE_PACKING;
    }
    else
    {
        this.state = self.STATE_INACTIVE;
    }
    this._activeTurret = -1;
    if (this.firingEffect)
    {
        this.firingEffect.StopFiring();
    }
};

/**
 * Animation helper function for putting a turret set into idle state
 */
EveTurretSet.prototype.EnterStateIdle = function()
{
    var self = this;
    if (this.state == this.STATE_IDLE || this.state == this.STATE_UNPACKING)
    {
        return;
    }
    if (this.turretEffect)
    {
        this.activeAnimation.StopAllAnimations();
        this.inactiveAnimation.StopAllAnimations();
        if (this.state == this.STATE_FIRING)
        {
            this.activeAnimation.PlayAnimation("Active", true);
            this.inactiveAnimation.PlayAnimation("Active", true);
        }
        else
        {
            this.activeAnimation.PlayAnimation("Deploy", false, function()
            {
                self.state = self.STATE_IDLE;
                self.activeAnimation.PlayAnimation("Active", true);
            });
            this.inactiveAnimation.PlayAnimation("Deploy", false, function()
            {
                self.state = self.STATE_IDLE;
                self.inactiveAnimation.PlayAnimation("Active", true);
            });
        }
        this.state = this.STATE_UNPACKING;
    }
    else
    {
        this.state = self.STATE_IDLE;
    }
    this._activeTurret = -1;
    if (this.firingEffect)
    {
        this.firingEffect.StopFiring();
    }
};

/**
 * Animation helper function for putting a turret set into a firing state
 */
EveTurretSet.prototype.EnterStateFiring = function()
{
    var self = this;

    if (!this.turretEffect || this.state == this.STATE_FIRING)
    {
        this._DoStartFiring();
        if (this.turretEffect)
        {
            this.activeAnimation.PlayAnimation("Fire", false, function()
            {
                self.activeAnimation.PlayAnimation("Active", true);
            });
        }
        return;
    }
    this.activeAnimation.StopAllAnimations();
    this.inactiveAnimation.StopAllAnimations();
    if (this.state == this.STATE_INACTIVE)
    {
        this.activeAnimation.PlayAnimation("Deploy", false, function()
        {
            self._DoStartFiring();
            self.activeAnimation.PlayAnimation("Fire", false, function()
            {
                self.activeAnimation.PlayAnimation("Active", true);
            });
        });
        this.inactiveAnimation.PlayAnimation("Deploy", false, function()
        {
            self.inactiveAnimation.PlayAnimation("Active", true);
        });
        this.state = this.STATE_UNPACKING;
    }
    else
    {
        this._DoStartFiring();
        this.activeAnimation.PlayAnimation("Fire", false, function()
        {
            self.activeAnimation.PlayAnimation("Active", true);
        });
        this.inactiveAnimation.PlayAnimation("Active", true);
    }
};

/**
 * Updates view dependent data
 * @constructor
 */
EveTurretSet.prototype.UpdateViewDependentData = function()
{
    if (this.firingEffect)
    {
        this.firingEffect.UpdateViewDependentData();
    }
}

/**
 * Animation helper function for turret firing
 * @private
 */
EveTurretSet.prototype._DoStartFiring = function()
{
    if (this.hasCyclingFiringPos)
    {
        this._currentCyclingFiresPos = 1 - this._currentCyclingFiresPos;
    }
    var turret = this.GetClosestTurret();
    if (this.firingEffect)
    {
        this.firingEffect.PrepareFiring(0, this.hasCyclingFiringPos ? this._currentCyclingFiresPos : -1);
    }
    this._activeTurret = turret;
    this.state = this.STATE_FIRING;
    this._recheckTimeLeft = 2;

    if (this.fireCallback)
    {
        this.fireCallbackPending = true;
    }
};

EveTurretSet._tempVec3 = [vec3.create(), vec3.create()];
EveTurretSet._tempQuat4 = [quat4.create(), quat4.create()];

/**
 * Helper function for finding out what turret should be firing
 * @returns {number}
 */
EveTurretSet.prototype.GetClosestTurret = function()
{
    var closestTurret = -1;
    var closestAngle = -2;
    var nrmToTarget = EveTurretSet._tempVec3[0];
    var nrmUp = EveTurretSet._tempQuat4[0];
    var turretPosition = EveTurretSet._tempQuat4[1];
    for (var i = 0; i < this.turrets.length; ++i)
    {
        turretPosition[0] = this.turrets[i].localTransform[12];
        turretPosition[1] = this.turrets[i].localTransform[13];
        turretPosition[2] = this.turrets[i].localTransform[14];
        turretPosition[3] = 1;
        mat4.multiplyVec4(this.parentMatrix, turretPosition);
        vec3.normalize(vec3.subtract(this.targetPosition, turretPosition, nrmToTarget));
        nrmUp[0] = 0;
        nrmUp[1] = 1;
        nrmUp[2] = 0;
        nrmUp[3] = 0;
        mat4.multiplyVec4(this.turrets[i].localTransform, nrmUp);
        mat4.multiplyVec4(this.parentMatrix, nrmUp);
        var angle = vec3.dot(nrmUp, nrmToTarget);
        if (angle > closestAngle)
        {
            closestTurret = i;
            closestAngle = angle;
        }
    }
    return closestTurret;
}
