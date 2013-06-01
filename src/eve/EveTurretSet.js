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

    this.firingEffect = null;
    
    this.display = true;
    
    this.geometryResource = null;
    this.animation = new Tw2AnimationController();
    
    this.turrets = [];
    
    this.STATE_INACTIVE = 0;
    this.STATE_IDLE = 1;
    this.STATE_FIRING = 2;
    this.STATE_PACKING = 3;
    this.STATE_UNPACKING = 4;

    this.state = this.STATE_IDLE;

    this.targetPosition = vec3.create();
    
    this._perObjectData = new Tw2PerObjectData();
    this._perObjectData.perObjectVSData = new Tw2RawData();
    this._perObjectData.perObjectVSData.Declare('clipData', 4);
    this._perObjectData.perObjectVSData.Declare('shipMatrix', 16);
    this._perObjectData.perObjectVSData.Declare('turretData0', 4);
    this._perObjectData.perObjectVSData.Declare('turretData1', 4);
    this._perObjectData.perObjectVSData.Declare('turretData2', 4);
    this._perObjectData.perObjectVSData.Declare('turretWorld0', 16);
    this._perObjectData.perObjectVSData.Declare('turretWorld1', 16);
    this._perObjectData.perObjectVSData.Declare('turretWorld2', 16);
    this._perObjectData.perObjectVSData.Declare('turretPose0', 15 * 4 * 3);
    this._perObjectData.perObjectVSData.Declare('turretPose1', 15 * 4 * 3);
    this._perObjectData.perObjectVSData.Declare('turretPose2', 15 * 4 * 3);
    this._perObjectData.perObjectVSData.Create();
    
    this.worldNames = ['turretWorld0', 'turretWorld1', 'turretWorld2'];
}

EveTurretSet.prototype.Initialize = function ()
{
    if (this.geometryResPath != '')
    {
        this.geometryResource = resMan.GetResource(this.geometryResPath);
        this.animation.SetGeometryResource(this.geometryResource);
        if (this.geometryResource)
        {
            this.geometryResource.RegisterNotification(this);
        }
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
    switch (this.state)
    {
    case this.STATE_INACTIVE:
        this.animation.PlayAnimation("Inactive", true);
        break;
    case this.STATE_IDLE:
        this.animation.PlayAnimation("Active", true);
        break;
    case this.STATE_FIRING:
        this.animation.PlayAnimation("Fire", true);
        break;
    case this.STATE_PACKING:
        this.EnterStateIdle();
        break;
    case this.STATE_UNPACKING:
        this.EnterStateDeactive();
        break;
    }
};

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
    if (this.geometryResource == null || !this.display)
    {
        return false;
    }
    if (mode == device.RM_OPAQUE)
    {
        var transforms = this.animation.GetBoneMatrixes(0);
        if (transforms.length == 0)
        {
            return true;
        }
        mat4.identity(this._perObjectData.perObjectVSData.Get('shipMatrix'));
        this._perObjectData.perObjectVSData.Get('clipData')[0] = this.bottomClipHeight;
        this._perObjectData.perObjectVSData.Set('turretPose0', transforms);
        this._perObjectData.perObjectVSData.Set('turretPose1', transforms);
        this._perObjectData.perObjectVSData.Set('turretPose2', transforms);
        for (var i = 0; i < this.turrets.length; ++i)
        {
            mat4.transpose(
                this.turrets[i].worldTransform, this._perObjectData.perObjectVSData.Get(this.worldNames[i]));
        }
        this._perObjectData.perObjectPSData = perObjectData.perObjectPSData;
    
        var batch = new Tw2ForwardingRenderBatch();
        batch.perObjectData = this._perObjectData;
        batch.geometryProvider = this;
        accumulator.Commit(batch);
    }
    if (this.firingEffect)
    {
        this.firingEffect.GetBatches(mode, accumulator, perObjectData);
    }
    return true;
};

EveTurretSet.prototype.Update = function (dt, parentMatrix)
{
    this.animation.Update(dt);
    if (this.firingEffect)
    {
        for (var i = 0; i < this.turrets.length; ++i)
        {
            this.firingEffect.SetMuzzlePosition(i, [this.turrets[i].localTransform[12], this.turrets[i].localTransform[13], this.turrets[i].localTransform[14]]);
            this.firingEffect.SetTargetPosition(this.targetPosition);
        }
        this.firingEffect.Update(dt);
    }
    for (var i = 0; i < this.turrets.length; ++i)
    {
        mat4.multiply(parentMatrix, this.turrets[i].localTransform, this.turrets[i].worldTransform);
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
        this.geometryResource.RenderAreas(0, 0, 1, effect);
    }
};

EveTurretSet.prototype.EnterStateDeactive = function ()
{
    if (this.state == this.STATE_INACTIVE || this.state == this.STATE_PACKING)
    {
        return;
    }
    var self = this;
    this.animation.StopAllAnimations();
    this.animation.PlayAnimation("Pack", false, function () { self.state = self.STATE_INACTIVE; self.animation.PlayAnimation("Inactive", true); } );
    this.state = this.STATE_PACKING;
};

EveTurretSet.prototype.EnterStateIdle = function ()
{
    if (this.state == this.STATE_IDLE || this.state == this.STATE_UNPACKING)
    {
        return;
    }
    var self = this;
    this.animation.StopAllAnimations();
    if (this.state == this.STATE_FIRING)
    {
        self.animation.PlayAnimation("Active", true);
    }
    else
    {
        this.animation.PlayAnimation("Deploy", false, function () { self.state = self.STATE_IDLE; self.animation.PlayAnimation("Active", true); } );
    }
    this.state = this.STATE_UNPACKING;
};

EveTurretSet.prototype.EnterStateFiring = function ()
{
    if (this.state == this.STATE_FIRING)
    {
        return;
    }
    var self = this;
    this.animation.StopAllAnimations();
    if (this.state == this.STATE_INACTIVE)
    {
        this.animation.PlayAnimation("Deploy", false, function () { self.state = self.STATE_FIRING; self.Fire(); self.animation.PlayAnimation("Fire", true, function () { self.Fire(); }); });
        this.state = this.STATE_UNPACKING;
    }
    else
    {
        self.state = self.STATE_FIRING;
        self.Fire();
        self.animation.PlayAnimation("Fire", true, function () { self.Fire(); });
    }
};

EveTurretSet.prototype.ForceStateDeactive = function ()
{
    if (this.state == this.STATE_INACTIVE)
    {
        return;
    }
    this.animation.StopAllAnimations();
    this.animation.PlayAnimation("Inactive", true);
    this.state = this.STATE_INACTIVE;
};

EveTurretSet.prototype.ForceStateIdle = function ()
{
    if (this.state == this.STATE_IDLE)
    {
        return;
    }
    this.animation.StopAllAnimations();
    this.animation.PlayAnimation("Active", true);
    this.state = this.STATE_IDLE;
};

EveTurretSet.prototype.Fire = function ()
{
    if (this.firingEffect)
    {
        this.firingEffect.Fire();
    }
};