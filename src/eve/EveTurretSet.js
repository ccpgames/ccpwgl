function EveTurretData()
{
    this.visible = true;
    this.localTransform = mat4.create();
    this.worldTransform = mat4.create();
}

function EveTurretSet()
{
    this.name = '';
    this.boundingSphere = [0, 0, 0, 0];
    this.bottomClipHeight = 0;
    this.locatorName = '';
    this.turretEffect = null;
    this.geometryResPath = '';
    this.sysBoneHeight = 0;
    this.firingEffectResPath = '';
    this.hasCyclingFiringPos = false;

    this.firingEffect = null;
    
    this.display = true;
    
    this.geometryResource = null;
    this.activeAnimation = new Tw2AnimationController();
    this.inactiveAnimation = new Tw2AnimationController();

    this.turrets = [];
    
    this.STATE_INACTIVE = 0;
    this.STATE_IDLE = 1;
    this.STATE_FIRING = 2;
    this.STATE_PACKING = 3;
    this.STATE_UNPACKING = 4;

    this.state = this.STATE_IDLE;

    this.targetPosition = vec3.create();
    
    this._perObjectDataActive = new Tw2PerObjectData();
    this._perObjectDataActive.perObjectVSData = new Tw2RawData();
    this._perObjectDataActive.perObjectVSData.Declare('clipData', 4);
    this._perObjectDataActive.perObjectVSData.Declare('shipMatrix', 16);
    this._perObjectDataActive.perObjectVSData.Declare('turretWorld0', 16);
    this._perObjectDataActive.perObjectVSData.Declare('turretWorld1', 16);
    this._perObjectDataActive.perObjectVSData.Declare('turretWorld2', 16);
    this._perObjectDataActive.perObjectVSData.Declare('turretPose0', 15 * 4 * 3);
    this._perObjectDataActive.perObjectVSData.Declare('turretPose1', 15 * 4 * 3);
    this._perObjectDataActive.perObjectVSData.Declare('turretPose2', 15 * 4 * 3);
    this._perObjectDataActive.perObjectVSData.Create();

    this._perObjectDataInactive = new Tw2PerObjectData();
    this._perObjectDataInactive.perObjectVSData = new Tw2RawData();
    this._perObjectDataInactive.perObjectVSData.Declare('clipData', 4);
    this._perObjectDataInactive.perObjectVSData.Declare('shipMatrix', 16);
    this._perObjectDataInactive.perObjectVSData.Declare('turretWorld0', 16);
    this._perObjectDataInactive.perObjectVSData.Declare('turretWorld1', 16);
    this._perObjectDataInactive.perObjectVSData.Declare('turretWorld2', 16);
    this._perObjectDataInactive.perObjectVSData.Declare('turretPose0', 15 * 4 * 3);
    this._perObjectDataInactive.perObjectVSData.Declare('turretPose1', 15 * 4 * 3);
    this._perObjectDataInactive.perObjectVSData.Declare('turretPose2', 15 * 4 * 3);
    this._perObjectDataInactive.perObjectVSData.Create();

    this.worldNames = ['turretWorld0', 'turretWorld1', 'turretWorld2'];

    this._activeTurret = -1;
    this._recheckTimeLeft = 0;
    this._currentCyclingFiresPos = 0;
}

EveTurretSet.positionBoneSkeletonNames = [
    "Pos_Fire01",
	"Pos_Fire02",
	"Pos_Fire03",
	"Pos_Fire04",
	"Pos_Fire05",
	"Pos_Fire06",
	"Pos_Fire07",
	"Pos_Fire08"];

EveTurretSet.prototype.Initialize = function ()
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
    if (this.firingEffectResPath != '') {
        var self = this;
        resMan.GetObject(this.firingEffectResPath, function (object) { self.firingEffect = object; });
    }
};

EveTurretSet.prototype.RebuildCachedData = function (resource)
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
        this.activeAnimation.PlayAnimation("Fire", false, function () { self.activeAnimation.PlayAnimation("Active", true); });
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

EveTurretSet.prototype.InitializeFiringEffect = function () {
    if (!this.firingEffect) {
        return;
    }
    if (this.geometryResource && this.geometryResource.models.length) {
        var model = this.geometryResource.models[0];
        for (var i = 0; i < this.firingEffect.GetPerMuzzleEffectCount() ; ++i) {
            this.firingEffect.SetMuzzleBoneID(i, model.FindBoneByName(EveTurretSet.positionBoneSkeletonNames[i]));
        }
    }
}

EveTurretSet.prototype.SetLocalTransform = function (index, localTransform)
{
    if (index >= this.turrets.length)
    {
        var data = new EveTurretData();
        data.localTransform = localTransform;
        this.turrets[index] = data;
    }
    else
    {
        this.turrets[index].localTransform = localTransform;
    }
};

EveTurretSet.prototype.GetBatches = function (mode, accumulator, perObjectData)
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
        mat4.identity(this._perObjectDataInactive.perObjectVSData.Get('shipMatrix'));
        this._perObjectDataInactive.perObjectVSData.Get('clipData')[0] = this.bottomClipHeight;
        this._perObjectDataInactive.perObjectVSData.Set('turretPose0', transforms);
        this._perObjectDataInactive.perObjectVSData.Set('turretPose1', transforms);
        this._perObjectDataInactive.perObjectVSData.Set('turretPose2', transforms);
        for (var i = 0; i < this.turrets.length; ++i)
        {
            mat4.transpose(
                this.turrets[i].worldTransform, this._perObjectDataInactive.perObjectVSData.Get(this.worldNames[i]));
        }
        this._perObjectDataInactive.perObjectPSData = perObjectData.perObjectPSData;
    
        var batch = new Tw2ForwardingRenderBatch();
        batch.renderMode = mode;
        batch.renderActive = false;
        batch.perObjectData = this._perObjectDataInactive;
        batch.geometryProvider = this;
        accumulator.Commit(batch);

        if (this.state == this.STATE_FIRING) {
            var transforms = this.activeAnimation.GetBoneMatrixes(0);
            if (transforms.length == 0) {
                return true;
            }
            mat4.identity(this._perObjectDataActive.perObjectVSData.Get('shipMatrix'));
            this._perObjectDataActive.perObjectVSData.Get('clipData')[0] = this.bottomClipHeight;
            this._perObjectDataActive.perObjectVSData.Set('turretPose0', transforms);
            this._perObjectDataActive.perObjectVSData.Set('turretPose1', transforms);
            this._perObjectDataActive.perObjectVSData.Set('turretPose2', transforms);
            for (var i = 0; i < this.turrets.length; ++i) {
                mat4.transpose(
                    this.turrets[i].worldTransform, this._perObjectDataActive.perObjectVSData.Get(this.worldNames[i]));
            }
            this._perObjectDataActive.perObjectPSData = perObjectData.perObjectPSData;

            var batch = new Tw2ForwardingRenderBatch();
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

EveTurretSet.prototype.Update = function (dt, parentMatrix)
{
    if (this.turretEffect) {
        this.activeAnimation.Update(dt);
        this.inactiveAnimation.Update(dt);
    }
    for (var i = 0; i < this.turrets.length; ++i) {
        mat4.multiply(parentMatrix, this.turrets[i].localTransform, this.turrets[i].worldTransform);
    }
    if (this.firingEffect)
    {
        if (this._activeTurret != -1) {
            if (this.firingEffect.isLoopFiring) {
                if (this.state == this.STATE_FIRING) {
                    this._recheckTimeLeft -= dt;
                    if (this._recheckTimeLeft <= 0) {
                        this._DoStartFiring();
                    }
                }
            }
            if (this.activeAnimation.models.length) {
                var bones = this.activeAnimation.models[0].bonesByName;
                for (var i = 0; i < this.firingEffect.GetPerMuzzleEffectCount() ; ++i) {
                    var transform = bones[EveTurretSet.positionBoneSkeletonNames[i]].worldTransform;
                    mat4.multiply(this.turrets[this._activeTurret].worldTransform, transform, this.firingEffect.GetMuzzleTransform(i));
                }
            }
            else {
                for (var i = 0; i < this.firingEffect.GetPerMuzzleEffectCount() ; ++i) {
                    mat4.set(this.turrets[this._activeTurret].worldTransform, this.firingEffect.GetMuzzleTransform(i));
                }
            }
        }

        vec3.set(this.targetPosition, this.firingEffect.endPosition);
        this.firingEffect.Update(dt);
    }
};

EveTurretSet.prototype.Render = function (batch, overrideEffect)
{
    var effect = typeof (overrideEffect) == 'undefined' ? this.turretEffect : overrideEffect;
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
        var isActive = this.state == this.STATE_FIRING && index == this._activeTurret;
        if (batch.renderActive == isActive) {
            this.geometryResource.RenderAreas(0, 0, 1, effect);
        }
    }
};

EveTurretSet.prototype.EnterStateDeactive = function ()
{
    if (this.state == this.STATE_INACTIVE || this.state == this.STATE_PACKING)
    {
        return;
    }
    var self = this;
    if (this.turretEffect) {
        this.activeAnimation.StopAllAnimations();
        this.inactiveAnimation.StopAllAnimations();
        this.activeAnimation.PlayAnimation("Pack", false, function () { self.state = self.STATE_INACTIVE; self.activeAnimation.PlayAnimation("Inactive", true); });
        this.inactiveAnimation.PlayAnimation("Pack", false, function () { self.state = self.STATE_INACTIVE; self.inactiveAnimation.PlayAnimation("Inactive", true); });
        this.state = this.STATE_PACKING;
    }
    else {
        this.state = self.STATE_INACTIVE;
    }
    this._activeTurret = -1;
    if (this.firingEffect) {
        this.firingEffect.StopFiring();
    }
};

EveTurretSet.prototype.EnterStateIdle = function ()
{
    if (this.state == this.STATE_IDLE || this.state == this.STATE_UNPACKING)
    {
        return;
    }
    if (this.turretEffect) {
        this.activeAnimation.StopAllAnimations();
        this.inactiveAnimation.StopAllAnimations();
        if (this.state == this.STATE_FIRING) {
            this.activeAnimation.PlayAnimation("Active", true);
            this.inactiveAnimation.PlayAnimation("Active", true);
        }
        else {
            var self = this;
            this.activeAnimation.PlayAnimation("Deploy", false, function () { self.state = self.STATE_IDLE; self.activeAnimation.PlayAnimation("Active", true); });
            this.inactiveAnimation.PlayAnimation("Deploy", false, function () { self.state = self.STATE_IDLE; self.inactiveAnimation.PlayAnimation("Active", true); });
        }
        this.state = this.STATE_UNPACKING;
    }
    else {
        this.state = self.STATE_IDLE;
    }
    this._activeTurret = -1;
    if (this.firingEffect) {
        this.firingEffect.StopFiring();
    }
};

EveTurretSet.prototype.EnterStateFiring = function ()
{
    if (!this.turretEffect || this.state == this.STATE_FIRING)
    {
        this._DoStartFiring();
        if (this.turretEffect) {
            var self = this;
            this.activeAnimation.PlayAnimation("Fire", false, function () { self.activeAnimation.PlayAnimation("Active", true); });
        }
        return;
    }
    this.activeAnimation.StopAllAnimations();
    this.inactiveAnimation.StopAllAnimations();
    if (this.state == this.STATE_INACTIVE)
    {
        var self = this;
        this.activeAnimation.PlayAnimation("Deploy", false, function () { self._DoStartFiring(); self.activeAnimation.PlayAnimation("Fire", false, function () { self.activeAnimation.PlayAnimation("Active", true); }); });
        this.inactiveAnimation.PlayAnimation("Deploy", false, function () { self.inactiveAnimation.PlayAnimation("Active", true); });
        this.state = this.STATE_UNPACKING;
    }
    else
    {
        this._DoStartFiring();
        var self = this;
        this.activeAnimation.PlayAnimation("Fire", false, function () { self.activeAnimation.PlayAnimation("Active", true); });
        this.inactiveAnimation.PlayAnimation("Active", true);
    }
};

EveTurretSet.prototype.UpdateViewDependentData = function () {
    if (this.firingEffect) {
        this.firingEffect.UpdateViewDependentData();
    }
}

EveTurretSet.prototype._DoStartFiring = function () {
    if (this.hasCyclingFiringPos) {
        this._currentCyclingFiresPos = 1 - this._currentCyclingFiresPos;
    }
    var turret = this.GetClosestTurret();
    if (this.firingEffect) {
        this.firingEffect.PrepareFiring(0, this.hasCyclingFiringPos ? this._currentCyclingFiresPos : -1);
    }
    this._activeTurret = turret;
    this.state = this.STATE_FIRING;
    this._recheckTimeLeft = 2;
}

EveTurretSet._tempVec3 = [vec3.create(), vec3.create()];
EveTurretSet._tempQuat4 = [quat4.create()];

EveTurretSet.prototype.GetClosestTurret = function () {
    var closestTurret = -1;
    var closestAngle = -2;
    var nrmToTarget = EveTurretSet._tempVec3[0];
    var nrmUp = EveTurretSet._tempQuat4[0];
    var turretPosition = EveTurretSet._tempVec3[1];
    for (var i = 0; i < this.turrets.length; ++i) {
        turretPosition[0] = this.turrets[i].worldTransform[12];
        turretPosition[1] = this.turrets[i].worldTransform[13];
        turretPosition[2] = this.turrets[i].worldTransform[14];
        vec3.normalize(vec3.subtract(this.targetPosition, turretPosition, nrmToTarget));
        nrmUp[0] = 0;
        nrmUp[1] = 1;
        nrmUp[2] = 0;
        nrmUp[3] = 0;
        mat4.multiplyVec4(this.turrets[i].worldTransform, nrmUp);
        var angle = vec3.dot(nrmUp, nrmToTarget);
        if (angle > closestAngle) {
            closestTurret = i;
            closestAngle = angle;
        }
    }
    return closestTurret;
}
