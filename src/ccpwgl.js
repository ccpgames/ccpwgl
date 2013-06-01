var ccpwgl = (function (ccpwgl_int)
{
    var ccpwgl = {};

    /**
    * Values for textureQuality option that can be passed to ccpwgl.initialize.
    */
    ccpwgl.TextureQuality = { HIGH: 0, MEDIUM: 1, LOW: 2 };

    /**
    * Values for textureQuality option that can be passed to ccpwgl.initialize.
    */
    ccpwgl.ShaderQuality = { HIGH: 'hi', LOW: 'lo' };

    /**
    * Resource unload policty. Controls how cached resources are evicted from
    * memory. See ccpwgl.getResourceUnloadPolicy and ccpwgl.setResourceUnloadPolicy.
    * When set to MANUAL you need to call ccpwgl.clearCachedResources function manually
    * from time to time to clear resources from memory cache. When set to USAGE_BASED
    * (default) resources are automatically removed from the cache if they are not used
    * for a specified period of time.
    * It is preferable to use USAGE_BASED, but ocasionally this will unload resources
    * when you don't want to (for example if you temporary hide a ship). In such cases
    * you will have to use MANUAL policy and call ccpwgl.clearCachedResources when 
    * you know that all resources you need are loaded (see ccpwgl.isLoading).
    */
    ccpwgl.ResourceUnloadPolicy = { MANUAL: 0, USAGE_BASED: 1 };

    /**
    * Turret states
    */
    ccpwgl.TurretState = { IDLE: 0, OFFLINE: 1, FIRING: 2 };

    /**
    * Ship siege state
    */
    ccpwgl.ShipSiegeState = { NORMAL: 0, SIEGE: 1 };

    /**
    * Exception class for objects that can be thrown by ccpwgl.initialize function if
    * WebGL context is not available.
    */
    ccpwgl.NoWebGLError = function ()
    {
        this.name = "NoWebGLError";
        this.message = "WebGL context is not available";
    };
    ccpwgl.NoWebGLError.prototype = Object.create(Error.prototype);
    ccpwgl.NoWebGLError.prototype.constructor = ccpwgl.NoWebGLError;

    /**
    * Exception that is thrown by some methods when their object .red files is not yet loaded.
    */
    ccpwgl.IsStillLoadingError = function ()
    {
        this.name = "IsStillLoadingError";
        this.message = "Cannot process the request until the object is loaded";
    };
    ccpwgl.IsStillLoadingError.prototype = Object.create(Error.prototype);
    ccpwgl.IsStillLoadingError.prototype.constructor = ccpwgl.IsStillLoadingError;

    /** Current scene @type {ccpwgl.Scene} **/
    var scene = null;
    /** Current camera **/
    var camera = null;
    /** Postprocessing effect @type {ccpwlg_int.Tw2Postprocess} **/
    var postprocess = null;
    /** If the postprocessing should be applied **/
    var postprocessingEnabled = false;
    /** Background clear color **/
    var clearColor = [0, 0, 0, 1];
    /** If scene updates and update callbacks are to be called **/
    var updateEnabled = true;
    /** If scene is to be rendered **/
    var renderingEnabled = true;
    /** Current resource unload policy @type {ccpwgl.ResourceUnloadPolicy} **/
    var resourceUnloadPolicy = ccpwgl.ResourceUnloadPolicy.USAGE_BASED;

    /**
    * Callback that is fired before rendering a scene, but after setting view/projection
    * matrixes and clearing the back buffer. Can be used for per-frame update or for
    * rendering something on the background. The dt parameter passed to the function is
    * frame time in seconds.
    * If there is no current scene set this callback is not called.
    * @type {!function(dt): void}
    */
    ccpwgl.onPreRender = null;

    /**
    * Callback that is fired after the scene is rendered, but before postprocessing. Can be used 
    * for rendering additional 3D geometry.
    * If there is no current scene set this callback is not called. The dt parameter passed to the function is
    * frame time in seconds.
    * @type {!function(dt): void}
    */
    ccpwgl.onPostSceneRender = null;

    /**
    * Callback that is fired after the scene is rendered and postprocessing is applied. Can be 
    * used for rendering something in front of the scene (UI, etc.). The dt parameter passed to the function is
    * frame time in seconds.
    * @type {!function(dt): void}
    */
    ccpwgl.onPostRender = null;

    /**
    * Internal render/update function. Is called every frame. 
    * @param {number} dt Frame time.
    **/
    function render(dt)
    {
        if (updateEnabled && camera && camera.update)
        {
            camera.update(dt);
        }
        if (!scene || !scene.wrappedScene)
        {
            if (ccpwgl.onPostRender)
            {
                ccpwgl.onPostRender(dt);
            }
            return true;
        }
        if (updateEnabled)
        {
            for (var i = 0; i < scene.objects.length; ++i)
            {
                if (scene.objects[i].onUpdate)
                {
                    scene.objects[i].onUpdate.call(scene.objects[i], dt);
                }
            }
            scene.wrappedScene.Update(dt);
        }
        if (renderingEnabled)
        {
            var d = ccpwgl_int.device;
            d.SetStandardStates(d.RM_OPAQUE);
            d.gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
            d.gl.clearDepth(1.0);
            d.gl.viewport(0, 0, d.viewportWidth, d.viewportHeight);
            d.gl.clear(d.gl.COLOR_BUFFER_BIT | d.gl.DEPTH_BUFFER_BIT);

            d.SetProjection(camera.getProjection(d.viewportWidth / d.viewportHeight));
            d.SetView(camera.getView());

            if (ccpwgl.onPreRender)
            {
                ccpwgl.onPreRender(dt);
            }

            scene.wrappedScene.Render();

            if (ccpwgl.onPostSceneRender)
            {
                ccpwgl.onPostSceneRender(dt);
            }

            if (postprocess && postprocessingEnabled)
            {
                postprocess.Render();
            }
            else
            {
                // We have crap in back buffer alpha channel, so clear it
                d.gl.colorMask(false, false, false, true);
                d.gl.clearColor(0.0, 0.0, 0.0, 1.0);
                d.gl.clear(d.gl.COLOR_BUFFER_BIT);
                d.gl.colorMask(true, true, true, true);
            }
        }
        if (ccpwgl.onPostRender)
        {
            ccpwgl.onPostRender(dt);
        }

        return true;
    }


    /**
    * Initializes WebGL library. This function needs to be called before most of other
    * function from this module. The function accepts a canvas object that is to be used
    * outputting WebGL graphics and optional parameters that are passed as a map (object).
    * The parameters can be:
    * - textureQuality: one of ccpwgl.TextureQuality members, texture quality (size of loaded
    *   textures) with HIGH being the original size, MEDIUM - half the original size, LOW - a quater.
    *   Setting a lower texture quality results in smaller download sizes and possibly better
    *   performance on low-end machines. Defaults to HIGH.
    * - shaderQuality: one of ccpwgl.ShaderQuality members. Low quality shaders might improve 
    *   performance on low-end machines, but do look ugly. Defaults to HIGH.
    * - anisotropicFilter: boolean value; if true anisotropic texture filtering will be
    *   turned on if browser supports it, if false anisotropic texture filtering is disabled.
    *   Disabling anisotropic filtering might result in better performance. Defaults to true.
    * - postprocessing: boolean value; if true, postprocessing effects are applied to the
    *   rendered image. Disabling postprocessing effects might result in better performance.
    *   Defaults to false. You can also turn this option on and off with 
    *   ccpwgl.enablePostprocessing call.
    *
    * @param {HtmlCanvas} canvas HTML Canvas object that is used for WebGL output.
    * @param {Object} params Optional parameters.
    * @throws {NoWebGLError} If WebGL context is not available (IE or older browsers for example).
    */
    ccpwgl.initialize = function (canvas, params)
    {
        function getOption(params, name, defaultValue)
        {
            if (params && name in params)
            {
                return params[name];
            }
            return defaultValue;
        }
        var d = ccpwgl_int.device;
        d.mipLevelSkipCount = getOption(params, 'textureQuality', 0);
        d.shaderModel = getOption(params, 'shaderQuality', 'hi');
        d.enableAnisotropicFiltering = getOption(params, 'anisotropicFilter', true);
        if (!d.CreateDevice(canvas))
        {
            throw new ccpwgl.NoWebGLError();
        }
        d.Schedule(render);

        postprocessingEnabled = getOption(params, 'postprocessing', false);
        if (postprocessingEnabled)
        {
            postprocess = new ccpwgl_int.Tw2PostProcess();
        }
    };

    /**
    * Sets/overrides URLs for resource paths. Resources paths used inside the engine have a 
    * format "namespace:/path" where namespace is usualy "res" which resolves to the 
    * eveonline CDN server and path is a relative path to the resource. You can extend 
    * the resource loading by using a different namespace to load some resources from your 
    * server. You can also override the default "res" namespace to load EVE resources from
    * a different server.
    * @example
    * ccpwgl.setResourcePath('myres', 'http://www.myserver.com/resources/');
    * This call will forward all resource paths "myres:/blah_blah_blah" to 
    * http://www.myserver.com/resources/blah_blah_blah.
    *
    * @param {string} namespace Resource namespace.
    * @param {path} URL to resource root. Needs to have a trailing slash.
    */
    ccpwgl.setResourcePath = function (namespace, path)
    {
        ccpwgl_int.resMan.resourcePaths[namespace] = path;
    };

    /**
    * Enables/disables postprocessing effects. Triggers shader loading the first time 
    * postprocessing is enabled, so the actual postprocessing will be turn on with a
    * delay after the first enabling call.
    *
    * @param {boolean} enable Enable/disable postprocessing.
    */
    ccpwgl.enablePostprocessing = function (enable)
    {
        postprocessingEnabled = enable;
        if (postprocessingEnabled && !postprocess)
        {
            postprocess = new ccpwgl_int.Tw2PostProcess();
        }
    };

    /**
    * Assigns an active camera used for scene rendering. A camera is an object that is 
    * required to have three following methods (that are called during rendering):
    * - update: function (dt) - a chance for camera object to update itself once per frame;
    *   the dt parameter is frame time in seconds
    * - getView: function () - return mat4 object, the view matrix
    * - getProjection: function (aspect) - return mat4 object, the projection matrix; the
    *   aspect parameter is the aspect ration: canvas width divided by canvas height.
    *
    * @param {Object} newCamera Current camera object.
    */
    ccpwgl.setCamera = function (newCamera)
    {
        camera = newCamera;
    };

    /**
    * Wrapper for static objects (stations, gates, asteroids, clouds, etc.).
    * Created with Scene.loadObject function.
    *
    * @constructor
    * @param {string} resPath Res path to object .red file
    * @param {!function(): void} onload Optional callback function that is called
    *   when object .red file is loaded. this will point to SpaceObject instance.
    */
    function SpaceObject(resPath, onload)
    {
        /** Wrapped ccpwgl_int object **/
        this.wrappedObject = null;
        /** Local to world space transform matrix @type {mat4} **/
        this.transform = mat4.create();
        /** Per-frame on update callback @type {!function(dt): void} **/
        this.onUpdate = null;

        var self = this;
        ccpwgl_int.resMan.GetObject(
            resPath,
            function (obj)
            {
                self.wrappedObject = obj;
                if (onload)
                {
                    onload.call(self);
                }
            });

        /**
        * Check if object .red file is still loading.
        *
        * @returns {boolean} True if object's .red file is loading; false otherwise.
        */
        this.isLoaded = function () { return this.wrappedObject != null; };

        /**
        * Returns object's bounding sphere if it is available. Throws an exception otherwise.
        *
        * @throws If object is not yet loaded or if object does not have bounding sphere
        * information.
        * @returns {[vec3, float]} Array with first element being sphere position in local
        * coordinate space and second - sphere radius.
        */
        this.getBoundingSphere = function ()
        {
            if (!this.isLoaded())
            {
                throw new ccpwgl.IsStillLoadingError();
            }
            if (!('boundingSphereRadius' in this.wrappedObject))
            {
                throw new TypeError('Object does not have bounding sphere information');
            }
            return [this.wrappedObject.boundingSphereCenter, this.wrappedObject.boundingSphereRadius];
        };

        /**
        * Sets transform matrix from local coordinate space to world.
        *
        * @param {mat4} newTransform Transform matrix.
        */
        this.setTransform = function (newTransform)
        {
            this.transform.set(newTransform);
            if (this.wrappedObject)
            {
                this.wrappedObject.transform.set(this.transform);
            }
        };

        /**
        * Returns transform matrix from local coordinate space to world.
        *
        * @returns {mat4} Transform matrix.
        */
        this.getTransform = function ()
        {
            return this.transform;
        };
    }

    /**
    * Wrapper for ships. On top of SpaceObject functionality it provides booster
    * and turret support.
    *
    * @constructor
    * @param {string} resPath Res path to ship .red file
    * @param {!function(): void} onload Optional callback function that is called
    *   when ship .red file is loaded. this will point to Ship instance.
    */
    function Ship(resPath, onload)
    {
        /** Wrapped ccpwgl_int ship object @type {ccpwgl_int.EveShip} **/
        this.wrappedObject = null;
        /** Local to world space transform matrix @type {mat4} **/
        this.transform = mat4.create();
        /** Internal boosters object @type {ccpwgl_int.EveBoosterSet} **/
        this.boosters = null;
        /** Current siege state @type {ccpwgl.ShipSiegeState} **/
        this.siegeState = ccpwgl.ShipSiegeState.NORMAL;
        /** Internal siege state, as opposed to Ship.siegeState also includes transition states @type {number} **/
        this.internalSiegeState = ccpwgl.ShipSiegeState.NORMAL;
        /** Callback to be called when ship is loaded. Provided by Ship.setSiegeState. @type {!function(state): void} **/
        this.onInitialSeigeState = null;
        /** Current booster effect strength. **/
        this.boosterStrength = 1;
        /** Cached number of turret slots. **/
        this.turretCount = undefined;
        /** Array of mounted turrets. **/
        this.turrets = [];
        /** Per-frame on update callback @type {!function(dt): void} **/
        this.onUpdate = null;
        /** Loaded turret color scheme ccpwgl_int object. **/
        this.turretColorScheme = null;

        var self = this;
        ccpwgl_int.resMan.GetObject(
            resPath,
            function (obj)
            {
                self.wrappedObject = obj;
                if (!(obj instanceof ccpwgl_int.EveShip))
                {
                    self.wrappedObject = null;
                    console.error('Object loaded with scene.loadShip is not a ship');
                    return;
                }
                if (self.boosters)
                {
                    self.wrappedObject.boosters = self.boosters;
                }
                self.wrappedObject.boosterGain = self.boosterStrength;
                switch (self.siegeState)
                {
                    case ccpwgl.ShipSiegeState.SIEGE:
                        self.wrappedObject.animation.PlayAnimation('SiegeLoop', true);
                        self.internalSiegeState = ccpwgl.ShipSiegeState.SIEGE;
                        break;
                    default:
                        self.wrappedObject.animation.PlayAnimation('NormalLoop', true);
                }
                if (this.onInitialSeigeState)
                {
                    this.onInitialSeigeState.call(self, self.siegeState);
                }
                for (var i = 0; i < self.turrets.length; ++i)
                {
                    if (self.turrets[i])
                    {
                        doMountTurret.call(self, i, self.turrets[i].path, self.turrets[i].state);
                    }
                }
                if (onload)
                {
                    onload.call(self);
                }
            }
        );

        /**
        * Check if ship's .red file is still loading.
        *
        * @returns {boolean} True if ship's .red file is loading; false otherwise.
        */
        this.isLoaded = function () { return this.wrappedObject != null; };

        /**
        * Returns ship's bounding sphere if this ship is loaded. Throws an exception otherwise.
        *
        * @throws If the ship is not yet loaded.
        * @returns {[vec3, float]} Array with first element being sphere position in local
        * coordinate space and second - sphere radius.
        */
        this.getBoundingSphere = function ()
        {
            if (!this.isLoaded())
            {
                throw new ccpwgl.IsStillLoadingError();
            }
            return [this.wrappedObject.boundingSphereCenter, this.wrappedObject.boundingSphereRadius];
        };

        /**
        * Sets transform matrix from local coordinate space to world.
        *
        * @param {mat4} newTransform Transform matrix.
        */
        this.setTransform = function (newTransform)
        {
            this.transform.set(newTransform);
            if (this.wrappedObject)
            {
                this.wrappedObject.transform.set(this.transform);
            }
        };

        /**
        * Returns transform matrix from local coordinate space to world.
        *
        * @returns {mat4} Transform matrix.
        */
        this.getTransform = function ()
        {
            return this.transform;
        };

        /**
        * Loads boosters effect for the ship.
        *
        * @param {string} resPath Res paths for boosters effect.
        * @param {!function(): void} onload Optional callback function that is called
        *   when boosters .red file is loaded. this will point to Ship instance.
        */
        this.loadBoosters = function (resPath, onload)
        {
            var self = this;
            ccpwgl_int.resMan.GetObject(
                resPath,
                function (obj)
                {
                    self.boosters = obj;
                    if (self.wrappedObject)
                    {
                        self.wrappedObject.boosters = obj;
                    }
                    if (onload)
                    {
                        onload.call(self);
                    }
                }
            );
        };

        /**
        * Sets strength of boosters effect.
        *
        * @param {number} boosterStrength Boosters strength from 0 to 1.
        */
        this.setBoosterStrength = function (boosterStrength)
        {
            this.boosterStrength = boosterStrength;
            if (this.wrappedObject)
            {
                this.wrappedObject.boosterGain = this.boosterStrength;
            }
        };

        /**
        * Loads color scheme .red file used for turrets. Turrets can use color scheme files
        * to have their colors match the ship (provided the color scheme is appropriate for 
        * the given ship). Without the color scheme, turrets will be rendered with default colors.
        *
        * @param {string} resPath Res paths for color scheme .red file.
        * @param {!function(): void} onload Optional callback function that is called
        *   when color scheme .red file is loaded. this will point to Ship instance.
        */
        this.setTurretColorScheme = function (resPath, onload)
        {
            var self = this;
            ccpwgl_int.resMan.GetObject(
                resPath,
                function (obj)
                {
                    self.turretColorScheme = obj;
                    if (self.isLoaded())
                    {
                        for (var i = 0; i < self.turrets.length; ++i)
                        {
                            if (self.turrets[i])
                            {
                                doMountTurret.call(self, i, self.turrets[i].path, self.turrets[i].state);
                            }
                        }
                    }
                    if (onload)
                    {
                        onload.call(self);
                    }
                }
            );
        };

        /**
        * Returns number of turret slots available on the ship.
        *
        * @throws If the ship's .red file is not yet loaded.
        * @returns {number} Number of turret slots.
        */
        this.getTurretSlotCount = function ()
        {
            if (this.turretCount !== undefined)
            {
                return this.turretCount;
            }
            if (!this.isLoaded())
            {
                throw new ccpwgl.IsStillLoadingError();
            }
            var slots = [];
            this.turretCount = 0;
            for (var i = 0; i < this.wrappedObject.locators.length; ++i)
            {
                var match = (/^locator_turret_([0-9]+)[a-z]$/i).exec(this.wrappedObject.locators[i].name);
                if (match)
                {
                    var index = parseInt(match[1], 10);
                    slots[index] = true;
                }
            }
            this.turretCount = slots.length;
            return this.turretCount;
        };

        /**
        * Loads the turret and mounts it in a specified slot index.
        *
        * @param {number} index Slot index to mount turret in.
        * @returns {string} resPath Res path to turret .red file.
        */
        this.mountTurret = function (index, resPath)
        {
            this.turrets[index] = { path: resPath, state: ccpwgl.TurretState.IDLE };
            if (this.isLoaded())
            {
                doMountTurret.call(this, index, resPath, ccpwgl.TurretState.IDLE);
            }
        };

        /**
        * Removes turret from specified slot.
        *
        * @param {number} index Turret slot to clear.
        */
        this.removeTurret = function (index)
        {
            this.turrets[index] = null;
            if (this.isLoaded())
            {
                var name = 'locator_turret_' + index;
                var ship = this.ship;
                for (var i = 0; i < ship.turretSets.length; ++i)
                {
                    if (ship.turretSets[i].locatorName == name)
                    {
                        ship.turretSets.splice(i, 1);
                        break;
                    }
                }
                ship.RebuildTurretPositions();
            }
        };

        /**
        * Sets turret's animation state. The specified slot must have a turret.
        *
        * @throws If the specified slot doesn't have turret mounted.
        * @param {number} index Turret slot.
        * @param {ccpwgl.TurretState} state Turret animation state.
        */
        this.setTurretState = function (index, state)
        {
            if (!this.turrets[index])
            {
                throw new ReferenceError('turret at index ' + index + ' is not defined');
            }
            if (this.turrets[index].state != state)
            {
                this.turrets[index].state = state;
                if (this.wrappedObject)
                {
                    var name = 'locator_turret_' + index;
                    for (var i = 0; i < this.wrappedObject.turretSets.length; ++i)
                    {
                        if (this.wrappedObject.turretSets[i].locatorName == name)
                        {
                            switch (state)
                            {
                                case ccpwgl.TurretState.FIRING:
                                    this.wrappedObject.turretSets[i].EnterStateFiring();
                                    break;
                                case ccpwgl.TurretState.OFFLINE:
                                    this.wrappedObject.turretSets[i].EnterStateDeactive();
                                    break;
                                default:
                                    this.wrappedObject.turretSets[i].EnterStateIdle();
                                    break;
                            }
                            break;
                        }
                    }
                }
            }
        };

        /** Internal helper method that mount a turret on a loaded ship **/
        function doMountTurret(slot, resPath, state)
        {
            var name = 'locator_turret_' + slot;
            var ship = this.wrappedObject;
            for (var i = 0; i < ship.turretSets.length; ++i)
            {
                if (ship.turretSets[i].locatorName == name)
                {
                    ship.turretSets.splice(i, 1);
                    break;
                }
            }
            var shipColorScheme = this.turretColorScheme;
            ship.RebuildTurretPositions();
            ccpwgl_int.resMan.GetObject(
                resPath,
                function (object)
                {
                    object.locatorName = name;
                    if (shipColorScheme && object.turretEffect && object.turretEffect.name != 'not_overridable')
                    {
                        var scheme = shipColorScheme;
                        for (var param in scheme.parameters)
                        {
                            if (typeof (scheme.parameters[param].resourcePath) == 'undefined')
                            {
                                if (object.turretEffect.name == 'half_overridable' && param == 'GlowColor')
                                {
                                    continue;
                                }
                                object.turretEffect.parameters[param] = scheme.parameters[param];
                            }
                        }
                        object.turretEffect.BindParameters();
                    }
                    ship.turretSets.push(object);
                    ship.RebuildTurretPositions();
                    switch (state)
                    {
                        case ccpwgl.TurretState.FIRING:
                            object.EnterStateFiring();
                            break;
                        case ccpwgl.TurretState.OFFLINE:
                            object.EnterStateDeactive();
                            break;
                        default:
                            object.EnterStateIdle();
                            break;
                    }
                });
        }

        /**
        * Sets ship siege state. Some ships support switching between "normal" and
        * siege state having different animations for these states. This function
        * switches ships animation from one state to another. If the ship .red file
        * is not yet loaded the transition will happen once the file is loaded.
        *
        * @param {ccpwgl.ShipSiegeState} state State to switch to.
        * @param {!function(state): void} onswitch Optional callback function that is called
        *   when animation has switched to the new state. This will point to Ship instance. The
        *   state parameter is the new siege state.
        */
        this.setSiegeState = function (state, onswitch)
        {
            if (this.siegeState != state)
            {
                this.siegeState = state;
                if (this.wrappedObject)
                {
                    if (state == ccpwgl.ShipSiegeState.SIEGE)
                    {
                        switch (this.internalSiegeState)
                        {
                            case ccpwgl.ShipSiegeState.IDLE:
                            case 101:
                                // 101 is transforming from siege state. Ideally we'd want to switch to StartSiege
                                // with correct offset into animation, but we don't have that functionality yet...
                                this.internalSiegeState = 100;
                                this.wrappedObject.animation.StopAllAnimations();
                                this.wrappedObject.animation.PlayAnimation(
                                    'StartSiege',
                                    false,
                                    function ()
                                    {
                                        self.internalSiegeState = ccpwgl.ShipSiegeState.SIEGE;
                                        self.wrappedObject.animation.StopAllAnimations();
                                        self.wrappedObject.animation.PlayAnimation('SiegeLoop', true);
                                        if (onswitch)
                                        {
                                            onswitch.call(self, self.internalSiegeState);
                                        }
                                    });
                                break;
                            default:
                                this.internalSiegeState = ccpwgl.ShipSiegeState.SIEGE;
                                this.wrappedObject.animation.StopAllAnimations();
                                this.wrappedObject.animation.PlayAnimation('SiegeLoop', true);
                                if (onswitch)
                                {
                                    onswitch.call(self, self.internalSiegeState);
                                }
                        }
                    }
                    else
                    {
                        switch (this.internalSiegeState)
                        {
                            case ccpwgl.ShipSiegeState.SIEGE:
                            case 100:
                                // 100 is transforming to siege state. Ideally we'd want to switch to StartSiege
                                // with correct offset into animation, but we don't have that functionality yet...
                                this.internalSiegeState = 101;
                                this.wrappedObject.animation.StopAllAnimations();
                                this.wrappedObject.animation.PlayAnimation(
                                    'EndSiege',
                                    false,
                                    function ()
                                    {
                                        self.internalSiegeState = ccpwgl.ShipSiegeState.IDLE;
                                        self.wrappedObject.animation.StopAllAnimations();
                                        self.wrappedObject.animation.PlayAnimation('NormalLoop', true);
                                    });
                                if (onswitch)
                                {
                                    onswitch.call(self, self.internalSiegeState);
                                }
                                break;
                            default:
                                this.internalSiegeState = ccpwgl.ShipSiegeState.IDLE;
                                this.wrappedObject.animation.StopAllAnimations();
                                this.wrappedObject.animation.PlayAnimation('NormalLoop', true);
                                if (onswitch)
                                {
                                    onswitch.call(self, self.internalSiegeState);
                                }
                        }
                    }
                }
                else
                {
                    this.onInitialSeigeState = onswitch;
                }
            }
            else
            {
                if (onswitch)
                {
                    onswitch.call(self, this.siegeState);
                }
            }
        };
    }

    /**
    * Wrapper for planets. Created with Scene.loadPlanet function.
    *
    * @constructor
    * @param {integer} itemID Planet's item ID.
    * @param {string} planetPath Res path to planet's .red template file.
    * @param {string} atmospherePath Res path to planet's .red atmosphere file.
    * @param {string} heightMap1 Res path to planet's first height map texture.
    * @param {string} heightMap2 Res path to planet's second height map texture.
    */
    function Planet(itemID, planetPath, atmospherePath, heightMap1, heightMap2)
    {
        /** Wrapped ccpwgl_int planet object @type {ccpwgl_int.EvePlanet} **/
        this.wrappedObject = new ccpwgl_int.EvePlanet();
        this.wrappedObject.Create(itemID, planetPath, atmospherePath, heightMap1, heightMap2);
        /** Per-frame on update callback @type {!function(dt): void} **/
        this.onUpdate = null;

        /**
        * Check if planet's resources are loaded and the resulting height map is generated.
        *
        * @returns {boolean} True if planet is loaded; false otherwise.
        */
        this.isLoaded = function () { return this.hightDirty; };

        /**
        * Returns planets's bounding sphere. We know it always is a unit sphere in local
        * coordinate space.
        *
        * @returns {[vec3, float]} Array with first element being sphere position in local
        * coordinate space [0, 0, 0] and second - sphere radius (==1).
        */
        this.getBoundingSphere = function ()
        {
            return [vec3.create([0, 0, 0]), 1];
        };

        /**
        * Sets transform matrix from local coordinate space to world.
        *
        * @param {mat4} newTransform Transform matrix.
        */
        this.setTransform = function (newTransform)
        {
            this.wrappedObject.highDetail.localTransform.set(newTransform);
        };

        /**
        * Returns transform matrix from local coordinate space to world.
        *
        * @returns {mat4} Transform matrix.
        */
        this.getTransform = function ()
        {
            return this.wrappedObject.highDetail.localTransform;
        };
    }

    /**
    * Scene gathers together all objects that are rendered together. Scene can reference
    * a number of ship, other space objects (stations, gates, etc.), planets, sun, background
    * nebula. Use ccpwgl.loadScene or ccpwgl.createScene functions to create a scene.
    *
    * @constructor
    */
    function Scene()
    {
        /** Wrapped ccpwgl_int scene object @type {ccpwgl_int.EveSpaceScene} **/
        this.wrappedScene = null;
        /** Array of rendered objects: SpaceObject, Ship or Planet **/
        this.objects = [];
        /** Current wrapped ccpwgl_int lensflare @type {ccpwgl_int.EveLensflare} **/
        this.sun = null;
        /** Current sun direction (if null, the value is taked from scene .red file) @type {vec3} **/
        this.sunDirection = null;
        /** Current sun color (if null, the value is taked from scene .red file) @type {vec4} **/
        this.sunLightColor = null;
        /** Fog parameters (if null, the value is taked from scene .red file) @type {Array} **/
        this.fog = null;

        /** 
        * Internal helper function that rebuilds a list of object in the wrapped
        * scene with alread loaded objects from Scene.objects array.
        **/
        function rebuildSceneObjects()
        {
            if (!this.wrappedScene)
            {
                return;
            }
            this.wrappedScene.objects.splice(0, this.wrappedScene.objects.length);
            for (var i = 0; i < this.objects.length; ++i)
            {
                if (this.objects[i].wrappedObject)
                {
                    this.wrappedScene.objects.push(this.objects[i].wrappedObject);
                }
            }
        }
		
        /**
        * Called when an EveSpaceScene is created or loaded.
        *
        * @param {ccpwlg_int.EveSpaceScene} obj New scene
        */
		function onSceneLoaded(obj)
		{
			this.wrappedScene = obj;
			if (this.sun)
			{
				obj.lensflares[0] = this.sun;
			}
			if (this.sunDirection)
			{
				obj.sunDirection.set(this.sunDirection);
			}
			if (this.sunLightColor)
			{
				obj.sunDiffuseColor.set(this.sunLightColor);
			}
			if (this.fog)
			{
				obj.fogStart = this.fog[0];
				obj.fogEnd = this.fog[1];
				obj.fogMax = this.fog[2];
				obj.fogColor.set(this.fog[3]);
			}
			rebuildSceneObjects.call(this);
		}
		
        /**
        * Creates a new empty scene.
        */
		this.create = function ()
		{
			onSceneLoaded.call(this, new ccpwgl_int.EveSpaceScene());
		};

        /**
        * Loads a scene from .red file.
        *
        * @param {string} resPath Res path to scene .red file
        * @param {!function(): void} onload Optional callback function that is called
        *   when scene .red file is loaded. this will point to Scene instance.
        */
        this.load = function (resPath, onload)
        {
            var self = this;
            ccpwgl_int.resMan.GetObject(
                resPath,
                function (obj)
                {
					onSceneLoaded.call(self, obj);
                    if (onload)
                    {
                        onload.call(self);
                    }
                });
        };

        /**
        * Check if scene's .red file is still loading.
        *
        * @returns {boolean} True if scene's .red file is loading; false otherwise.
        */
        this.isLoaded = function () { return this.wrappedScene != null; };

        /**
        * Loads a ship from .red file and adds it to scene's objects list.
        *
        * @param {string} resPath Res path to ship .red file
        * @param {!function(): void} onload Optional callback function that is called
        *   when ship .red file is loaded. this will point to Ship instance.
        * @returns {ccpwgl.Ship} A newly created ship instance.
        */
        this.loadShip = function (resPath, onload)
        {
            var self = this;
            var ship = new Ship(
                resPath,
                function ()
                {
                    rebuildSceneObjects.call(self);
                    if (onload)
                    {
                        onload.call(this);
                    }
                });
            this.objects.push(ship);
            if (ship.wrappedObject)
            {
                rebuildSceneObjects.call(this);
            }
            return ship;
        };

        /**
        * Loads a space object from .red file and adds it to scene's objects list.
        *
        * @param {string} resPath Res path to object .red file
        * @param {!function(): void} onload Optional callback function that is called
        *   when object .red file is loaded. this will point to SpaceObject instance.
        * @returns {ccpwgl.SpaceObject} A newly created object instance.
        */
        this.loadObject = function (resPath, onload)
        {
            var self = this;
            var object = new SpaceObject(
                resPath,
                function ()
                {
                    rebuildSceneObjects.call(self);
                    if (onload)
                    {
                        onload.call(this);
                    }
                });
            this.objects.push(object);
            if (object.wrappedObject)
            {
                rebuildSceneObjects.call(this);
            }
            return object;
        };

        /**
        * Creates a planet.
        *
        * @param {integer} itemID Planet's item ID.
        * @param {string} planetPath Res path to planet's .red template file.
        * @param {string} atmospherePath Res path to planet's .red atmosphere file.
        * @param {string} heightMap1 Res path to planet's first height map texture.
        * @param {string} heightMap2 Res path to planet's second height map texture.
        * @returns {ccpwgl.Planet} A newly created planet instance.
        */
        this.loadPlanet = function (itemID, planetPath, atmospherePath, heightMap1, heightMap2)
        {
            var self = this;
            var object = new Planet(itemID, planetPath, atmospherePath, heightMap1, heightMap2);
            this.objects.push(object);
            rebuildSceneObjects.call(this);
            return object;
        };

        /**
        * Returns object (ship or planet) at a specified index in scene's objects list.
        *
        * @thorws If index is out of bounds.
        * @param {number} index Object index.
        * @returns Object at specified index.
        */
        this.getObject = function (index)
        {
            if (index > 0 && index < this.objects.length)
            {
                return this.objects[index];
            }
            throw new ReferenceError('object index out of bounds');
        };

        /**
        * Returns index of an object (ship or planet) in scene's objects list.
        *
        * @param object Object to search for.
        * @returns {number} Object index or -1 if the object is not found.
        */
        this.indexOf = function (object)
        {
            for (var i = 0; i < this.objects.length; ++i)
            {
                if (this.objects[i] === object)
                {
                    return i;
                }
            }
            return -1;
        };

        /**
        * Removes object at specified index from scene's objects list.
        *
        * @thorws If index is out of bounds.
        * @param {number} index Object index.
        */
        this.removeObject = function (index)
        {
            if (index >= this.objects.length)
            {
                throw new ReferenceError('object index out of bounds');
            }
            this.objects.splice(index, 1);
            rebuildSceneObjects.call(this);
        };

        /**
        * Loads a sun (a flare) into the scene. Due to some limitations of WebGL there
        * can only be once sun in the scene. It doesn't appear in scene's object list.
        *
        * @param {string} resPath Res path to sun's .red file
        * @param {!function(): void} onload Optional callback function that is called
        *   when sun .red file is loaded. this will point to Scene instance.
        */
        this.loadSun = function (resPath, onload)
        {
            var self = this;
            ccpwgl_int.resMan.GetObject(
                resPath,
                function (obj)
                {
                    self.sun = obj;
                    if (self.wrappedScene)
                    {
                        self.wrappedScene.lensflares[0] = obj;
                    }
                    if (self.sunDirection)
                    {
                        vec3.negate(self.sunDirection, obj.position);
                    }
                    else if (self.wrappedScene)
                    {
                        vec3.negate(self.wrappedScene.sunDirection, obj.position);
                    }
                    if (onload)
                    {
                        onload.call(self);
                    }
                });
        };

        /**
        * Removes the sun (flare) from the scene.
        *
        * @throws If the scene doesn't have sun.
        */
        this.removeSun = function ()
        {
            if (!this.sun)
            {
                throw new ReferenceError('scene does not have a Sun');
            }
            this.sun = null;
            if (this.wrappedScene)
            {
                this.wrappedScene.lensflares = [];
            }
        };

        /**
        * Sets new sun direction. This affects both lighting on objects and
        * sun (flare) position.
        *
        * @param {vec3} direction Sun direction.
        */
        this.setSunDirection = function (direction)
        {
            this.sunDirection = direction;
            if (this.wrappedScene)
            {
                this.wrappedScene.sunDirection.set(this.sunDirection);
            }
            if (this.sun)
            {
                vec3.negate(direction, this.sun.position);
            }
        };

        /**
        * Sets color for the sunlight. This affects lighting on objects.
        *
        * @param {vec3} color Sunlight color as RGB vector.
        */
        this.setSunLightColor = function (color)
        {
            this.sunLightColor = color;
            if (this.wrappedScene)
            {
                this.wrappedScene.sunDiffuseColor.set(this.sunLightColor);
            }
        };

        /**
        * Sets fog parameters. Fog effect helps depth perception. It does not
        * affect planets.
        *
        * @param {number} startDistance Distance at which fog starts to appear.
        * @param {number} endDistance Distance at which fog reaches its maxOpacity opacity.
        * @param {number} maxOpacity Maximum fog opacity from 0 to 1.
        * @param {vec3} color Fog color as RGB vector.
        */
        this.setFog = function (startDistance, endDistance, maxOpacity, color)
        {
            this.fog = [startDistance, endDistance, maxOpacity, color];
            if (this.wrappedScene)
            {
                this.wrappedScene.fogStart = startDistance;
                this.wrappedScene.fogEnd = endDistance;
                this.wrappedScene.fogMax = maxOpacity;
                this.wrappedScene.fogColor.set(color);
            }
        };
    }

    /**
    * Loads a new scene from .red file and makes it the currect scene (the one that
    * will be automatically updated rendered into the canvas).
    *
    * @param {string} resPath Res path to scene's .red file
    * @param {!function(): void} onload Optional callback function that is called
    *   when scene .red file is loaded. this will point to Scene instance.
    * @returns {ccpwgl.Scene} Newly constructed scene.
    */
    ccpwgl.loadScene = function (resPath, onload)
    {
        scene = new Scene();
        scene.load(resPath, onload);
        return scene;
    };

    /**
    * Creates a new epmpty scne. The scene will not have background nebula and will
    * use a solid color to fill the background.
    *
    * @param {vec4} backgroundColor Scene background color as RGBA vector.
    * @returns {ccpwgl.Scene} Newly constructed scene.
    */
    ccpwgl.createScene = function (backgroundColor)
    {
        if (backgroundColor)
        {
            clearColor = backgroundColor;
        }
        scene = new Scene();
		scene.create();
        return scene;
    };

    /**
    * Checks if assets are still loading.
    *
    * @returns {boolean} True if any assets are still loading; false otherwise.
    */
    ccpwgl.isLoading = function ()
    {
        return ccpwgl_int.resMan.IsLoading();
    };

    /**
    * Enable/disable scene per-frame updates.
    *
    * @param {boolean} enable If true scene update and update callbacks are called
    *   every frame.
    */
    ccpwgl.enableUpdate = function (enable)
    {
        updateEnabled = enable;
    };

    /**
    * Enable/disable scene rendering.
    *
    * @param {boolean} enable If true scene is rendered into the canvas.
    */
    ccpwgl.enableRendering = function (enable)
    {
        renderingEnabled = enable;
    };

    /**
    * Returns current resource unload policy.
    *
    * @returns {ccpwgl.ResourceUnloadPolicy} Current resource unload policy.
    */
    ccpwgl.getResourceUnloadPolicy = function ()
    {
        return resourceUnloadPolicy;
    };

    /**
    * Assigns new resource unload policy.
    *
    * @param {ccpwgl.ResourceUnloadPolicy} policy New resource unload policy.
    * @param {number} timeout Optional timeout value (in seconds) when resource is unloaded
    *   from memomy if the policy is set to ccpwgl.ResourceUnloadPolicy.USAGE_BASED.
    */
    ccpwgl.setResourceUnloadPolicy = function (policy, timeout)
    {
        resourceUnloadPolicy = policy;
        ccpwgl_int.resMan.autoPurgeResources = policy == ccpwgl.ResourceUnloadPolicy.USAGE_BASED;
        if (timeout != undefined)
        {
            ccpwgl_int.resMan.purgeTime = timeout;
        }
    };

    /**
    * Manually clears resource cache.
    */
    ccpwgl.clearCachedResources = function ()
    {
        ccpwgl_int.resMan.Clear();
    };

    return ccpwgl;
} (ccpwgl_int || window));