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
    * Scene LOD settings: with LOD_ENABLED, scene will not try to render ships/objects that
    * are outside view frustum. Additionally it will hide some parts of ship (like decals)
    * for ships that too far away. Enabling LOD will help performance significantly for
    * scenes with a large number of objects. Defaults to LOD_DISABLED for compatibility.
    */
    ccpwgl.LodSettings = { LOD_DISABLED: 0, LOD_ENABLED: 1 };

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
    * Callback that is fired before updating scne state and before any rendering occurs. The dt parameter passed to the
    * function is frame time in seconds.
    * If there is no current scene set this callback is not called.
    * @type {!function(dt): void}
    */
    ccpwgl.onUpdate = null;

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

    var sof = new ccpwgl_int.EveSOF();

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
            if (ccpwgl.onUpdate)
            {
                ccpwgl.onUpdate(dt);
            }
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
    * - glParams: object; WebGL context creation parameters, see 
    *   https://www.khronos.org/registry/webgl/specs/1.0/#2.2. Defaults to none.
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
        var glParams = getOption(params, 'glParams', undefined);
        if (!d.CreateDevice(canvas, glParams))
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
     * Returns the whole Space Object Factory file.
     * Provides a callback that is called once SOF data has been loaded.
     * @param callback Function that is called when SOF data is ready. Called with a single parameter
     */
    ccpwgl.getSofData = function (callback)
    {
        sof.GetSofData(callback);
    };

    /**
     * Query ship hull names from space object factory database. Along with getSofFactionNames and getSofRaceNames this
     * function can be used to get all supported ship DNA strings (DNA string has a form "hull:faction:race" that can
     * be passed to loadShip function) to construct "random" ships. The function is asyncronous so the user needs to
     * provide a callback that is called once SOF data has been loaded.
     * @param callback Function that is called when SOF data is ready. Called with a single parameter that is an mapping
     * of all hull names to their descriptions.
     */
    ccpwgl.getSofHullNames = function (callback)
    {
        sof.GetHullNames(callback);
    };

    /**
     * Query ship faction names from space object factory database. Along with getSofHullNames and getSofRaceNames this
     * function can be used to get all supported ship DNA strings (DNA string has a form "hull:faction:race" that can
     * be passed to loadShip function) to construct "random" ships. The function is asyncronous so the user needs to
     * provide a callback that is called once SOF data has been loaded.
     * @param callback Function that is called when SOF data is ready. Called with a single parameter that is an mapping
     * of all faction names to their descriptions.
     */
    ccpwgl.getSofFactionNames = function (callback)
    {
        sof.GetFactionNames(callback);
    };

    /**
     * Query ship race names from space object factory database. Along with getSofHullNames and getSofFactionNames this
     * function can be used to get all supported ship DNA strings (DNA string has a form "hull:faction:race" that can
     * be passed to loadShip function) to construct "random" ships. The function is asyncronous so the user needs to
     * provide a callback that is called once SOF data has been loaded.
     * @param callback Function that is called when SOF data is ready. Called with a single parameter that is an mapping
     * of all race names to their descriptions.
     */
    ccpwgl.getSofRaceNames = function (callback)
    {
        sof.GetRaceNames(callback);
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
        this.wrappedObjects = [null, ];
        /** Local to world space transform matrix @type {mat4} **/
        this.transform = mat4.identity(mat4.create());
        /** Per-frame on update callback @type {!function(dt): void} **/
        this.onUpdate = null;

        var self = this;
        ccpwgl_int.resMan.GetObject(
            resPath,
            function (obj)
            {
                self.wrappedObjects[0] = obj;
                if ('transform' in self.wrappedObjects[0])
                {
                    self.wrappedObjects[0].transform.set(self.transform);
                }
                else if ('translation' in self.wrappedObjects[0])
                {
                    self.wrappedObjects[0].translation.set(self.transform.subarray(12, 15));
                    self.wrappedObjects[0].scaling[0] = vec3.length(self.transform);
                    self.wrappedObjects[0].scaling[1] = vec3.length(self.transform.subarray(4, 7));
                    self.wrappedObjects[0].scaling[2] = vec3.length(self.transform.subarray(8, 11));
                }
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
        this.isLoaded = function () { return this.wrappedObjects[0] != null; };

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
            if (!('boundingSphereRadius' in this.wrappedObjects[0]))
            {
                throw new TypeError('Object does not have bounding sphere information');
            }
            return [this.wrappedObjects[0].boundingSphereCenter, this.wrappedObjects[0].boundingSphereRadius];
        };

        /**
        * Sets transform matrix from local coordinate space to world.
        *
        * @param {mat4} newTransform Transform matrix.
        */
        this.setTransform = function (newTransform)
        {
            this.transform.set(newTransform);
            if (this.wrappedObjects[0])
            {
                if ('transform' in this.wrappedObjects[0])
                {
                    this.wrappedObjects[0].transform.set(this.transform);
                }
                else if ('translation' in this.wrappedObjects[0])
                {
                    this.wrappedObjects[0].translation.set(this.transform.subarray(12, 15));
                    this.wrappedObjects[0].scaling[0] = vec3.length(this.transform);
                    this.wrappedObjects[0].scaling[1] = vec3.length(this.transform.subarray(4, 7));
                    this.wrappedObjects[0].scaling[2] = vec3.length(this.transform.subarray(8, 11));
                }
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
        this.wrappedObjects = [null];
        /** Local to world space transform matrix @type {mat4} **/
        this.transform = mat4.identity(mat4.create());
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
        /** Local transforms for Tech3 ship parts **/
        this.partTransforms = [];
        /** Ship SOF DNA if the ship was constructed with SOF **/
        this.dna = undefined;

        var self = this;
        if (typeof resPath == 'string')
        {
            resPath = [resPath, ];
        }
        for (var i = 0; i < resPath.length; ++i)
        {
            this.wrappedObjects[i] = null;
        }

        function OnShipPartLoaded(index)
        {
            return function (obj)
            {
                self.wrappedObjects[index] = obj;
                if (!(obj instanceof ccpwgl_int.EveShip))
                {
                    self.wrappedObjects[index] = null;
                    console.error('Object loaded with scene.loadShip is not a ship');
                    return;
                }
                self.wrappedObjects[index].transform.set(self.transform);
                if (self.boosters)
                {
                    self.wrappedObjects[index].boosters = self.boosters;
                }
                self.wrappedObjects[index].boosterGain = self.boosterStrength;
                switch (self.siegeState)
                {
                    case ccpwgl.ShipSiegeState.SIEGE:
                        self.wrappedObjects[index].animation.PlayAnimation('SiegeLoop', true);
                        self.internalSiegeState = ccpwgl.ShipSiegeState.SIEGE;
                        break;
                    default:
                        self.wrappedObjects[index].animation.PlayAnimation('NormalLoop', true);
                }
                if (this.onInitialSeigeState)
                {
                    this.onInitialSeigeState.call(self, self.siegeState);
                }
                for (var i = 0; i < self.turrets.length; ++i)
                {
                    if (self.turrets[i])
                    {
                        doMountTurret.call(self, i, self.turrets[i].path, self.turrets[i].state, self.turrets[i].target);
                    }
                }
                if (self.isLoaded())
                {
                    if (self.wrappedObjects.length > 1)
                    {
                        assembleT3Ship();
                    }
                    if (onload) {
                        onload.call(self);
                    }
                }
            };
        }

        if (resPath.length > 1)
        {
            if (resPath.length != 5)
            {
                throw new TypeError('Invalid number of parts passed to Tech3 ship constructor');
            }
        }

        function assembleT3Ship()
        {
            var systemNames = [
		        "electronic",
		        "defensive",
		        "engineering",
		        "offensive",
		        "propulsion"];
            var systems = [];
            for (var i = 0; i < self.wrappedObjects.length; ++i)
            {
                var found = false;
                for (var j = 1; j < systemNames.length; ++j)
                {
                    var loc = self.wrappedObjects[i].FindLocatorTransformByName('locator_attach_' + systemNames[j]);
                    if (loc !== null)
                    {
                        if (systems[j - 1])
                        {
                            if (i == 4) {
                                break;
                            }
                            throw new TypeError('Invalid parts passed to Tech3 ship constructor');
                        }
                        systems[j - 1] = [i, loc.subarray(12, 15)];
                        found = true;
                        break;
                    }
                }
                if (!found)
                {
                    if (systems[4])
                    {
                        throw new TypeError('Invalid parts passed to Tech3 ship constructor');
                    }
                    systems[4] = [i, vec3.create()];
                }
            }
            var offset = vec3.create();
            for (i = 0; i < systems.length; ++i)
            {
                var index = systems[i][0];
                self.partTransforms[index] = mat4.identity(mat4.create());
                mat4.translate(self.partTransforms[index], offset);
                vec3.add(offset, systems[i][1]);
                mat4.multiply(self.transform, self.partTransforms[index], self.wrappedObjects[index].transform);
            }
        }

        /**
        * Check if ship's .red file is still loading.
        *
        * @returns {boolean} True if ship's .red file is loading; false otherwise.
        */
        this.isLoaded = function ()
        {
            for (var i = 0; i < this.wrappedObjects.length; ++i)
            {
                if (!this.wrappedObjects[i])
                {
                    return false;
                }
            }
            return true;
        };

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
            return [this.wrappedObjects[0].boundingSphereCenter, this.wrappedObjects[0].boundingSphereRadius];
        };

        /**
        * Sets transform matrix from local coordinate space to world.
        *
        * @param {mat4} newTransform Transform matrix.
        */
        this.setTransform = function (newTransform)
        {
            this.transform.set(newTransform);
            if (this.wrappedObjects.length < 2 || !this.isLoaded())
            {
                for (var i = 0; i < this.wrappedObjects.length; ++i)
                {
                    if (this.wrappedObjects[i])
                    {
                        this.wrappedObjects[i].transform.set(this.transform);
                    }
                }
            }
            else
            {
                for (var i = 0; i < this.wrappedObjects.length; ++i)
                {
                    mat4.multiply(self.transform, self.partTransforms[i], self.wrappedObjects[i].transform);
                }
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
                    for (var i = 0; i < self.wrappedObjects.length; ++i)
                    {
                        if (self.wrappedObjects[i])
                        {
                            self.wrappedObjects[i].boosters = obj;
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
        * Sets strength of boosters effect.
        *
        * @param {number} boosterStrength Boosters strength from 0 to 1.
        */
        this.setBoosterStrength = function (boosterStrength)
        {
            this.boosterStrength = boosterStrength;
            for (var i = 0; i < self.wrappedObjects.length; ++i)
            {
                if (this.wrappedObjects[i])
                {
                    this.wrappedObjects[i].boosterGain = this.boosterStrength;
                }
            }
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
            for (var j = 0; j < this.wrappedObjects.length; ++j)
            {
                for (var i = 0; i < this.wrappedObjects[j].locators.length; ++i)
                {
                    var match = (/^locator_turret_([0-9]+)[a-z]$/i).exec(this.wrappedObjects[j].locators[i].name);
                    if (match)
                    {
                        var index = parseInt(match[1], 10);
                        slots[index] = true;
                    }
                }
            }
            this.turretCount = slots.length - 1;
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
            this.turrets[index] = { path: resPath, state: ccpwgl.TurretState.IDLE, target: vec3.create() };
            if (this.isLoaded())
            {
                doMountTurret.call(this, index, resPath, ccpwgl.TurretState.IDLE, this.turrets[index].target);
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
                for (var j = 0; j < this.wrappedObjects.lenght; ++j)
                {
                    var ship = this.wrappedObjects[j];
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
            if (this.turrets[index].state != state || state == ccpwgl.TurretState.FIRING)
            {
                this.turrets[index].state = state;
                var name = 'locator_turret_' + index;
                for (var j = 0; j < this.wrappedObjects.length; ++j)
                {
                    if (this.wrappedObjects[j])
                    {
                        for (var i = 0; i < this.wrappedObjects[j].turretSets.length; ++i)
                        {
                            if (this.wrappedObjects[j].turretSets[i].locatorName == name)
                            {
                                switch (state)
                                {
                                    case ccpwgl.TurretState.FIRING:
                                        this.wrappedObjects[j].turretSets[i].EnterStateFiring();
                                        break;
                                    case ccpwgl.TurretState.OFFLINE:
                                        this.wrappedObjects[j].turretSets[i].EnterStateDeactive();
                                        break;
                                    default:
                                        this.wrappedObjects[j].turretSets[i].EnterStateIdle();
                                        break;
                                }
                                break;
                            }
                        }
                    }
                }
            }
        };

        /**
        * Sets turret's target position. The specified slot must have a turret.
        *
        * @throws If the specified slot doesn't have turret mounted.
        * @param {number} index Turret slot.
        * @param {vec3} target Target position in world space.
        */
        this.setTurretTargetPosition = function (index, target)
        {
            if (!this.turrets[index])
            {
                throw new ReferenceError('turret at index ' + index + ' is not defined');
            }
            vec3.set(target, this.turrets[index].target);
            var name = 'locator_turret_' + index;
            for (var j = 0; j < this.wrappedObjects.length; ++j)
            {
                if (this.wrappedObjects[j])
                {
                    for (var i = 0; i < this.wrappedObjects[j].turretSets.length; ++i)
                    {
                        if (this.wrappedObjects[j].turretSets[i].locatorName == name)
                        {
                            vec3.set(target, this.wrappedObjects[j].turretSets[i].targetPosition);
                            break;
                        }
                    }
                }
            }
        }

        /** Internal helper method that mount a turret on a loaded ship **/
        function doMountTurret(slot, resPath, state, targetPosition)
        {
            var name = 'locator_turret_' + slot;
            var objectIndex = null;
            for (var i = 0; i < this.wrappedObjects.length; ++i)
            {
                if (this.wrappedObjects[i])
                {
                    var foundLocator = false;
                    for (var j = 0; j < this.wrappedObjects[i].locators.length; ++j)
                    {
                        if (this.wrappedObjects[i].locators[j].name.substr(0, name.length) == name)
                        {
                            foundLocator = true;
                            break;
                        }
                    }
                    if (foundLocator)
                    {
                        objectIndex = i;
                        break;
                    }
                }
            }
            if (objectIndex === null)
            {
                return;
            }
            var ship = this.wrappedObjects[objectIndex];
            for (var i = 0; i < ship.turretSets.length; ++i)
            {
                if (ship.turretSets[i].locatorName == name)
                {
                    ship.turretSets.splice(i, 1);
                    break;
                }
            }


            ship.RebuildTurretPositions();
            ccpwgl_int.resMan.GetObject(
                resPath,
                function (object)
                {
                    object.locatorName = name;
                    if (self.dna) {
                        var faction = self.dna.split(':')[1];
                        sof.SetupTurretMaterial(object, faction, faction);
                    }
                    ship.turretSets.push(object);
                    ship.RebuildTurretPositions();
                    object.targetPosition = targetPosition;
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
            function getOnComplete(index, state, nextAnim) {
                return function () {
                    self.internalSiegeState = state;
                    self.wrappedObjects[index].animation.StopAllAnimations();
                    self.wrappedObjects[index].animation.PlayAnimation(nextAnim, true);
                    if (onswitch)
                    {
                        onswitch.call(self, self.internalSiegeState);
                    }
                };

            }
            if (this.siegeState != state)
            {
                this.siegeState = state;
                for (var j = 0; j < this.wrappedObjects.length; ++j)
                {
                    if (this.wrappedObjects[j])
                    {
                        if (state == ccpwgl.ShipSiegeState.SIEGE)
                        {
                            switch (this.internalSiegeState)
                            {
                                case ccpwgl.ShipSiegeState.NORMAL:
                                case 101:
                                    // 101 is transforming from siege state. Ideally we'd want to switch to StartSiege
                                    // with correct offset into animation, but we don't have that functionality yet...
                                    this.internalSiegeState = 100;
                                    this.wrappedObjects[j].animation.StopAllAnimations();
                                    this.wrappedObjects[j].animation.PlayAnimation(
                                        'StartSiege',
                                        false,
                                        getOnComplete(j, ccpwgl.ShipSiegeState.SIEGE, 'SiegeLoop'));
                                    break;
                                default:
                                    this.internalSiegeState = ccpwgl.ShipSiegeState.SIEGE;
                                    this.wrappedObjects[j].animation.StopAllAnimations();
                                    this.wrappedObjects[j].animation.PlayAnimation('SiegeLoop', true);
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
                                    this.wrappedObjects[j].animation.StopAllAnimations();
                                    this.wrappedObjects[j].animation.PlayAnimation(
                                        'EndSiege',
                                        false,
                                        getOnComplete(j, ccpwgl.ShipSiegeState.NORMAL, 'NormalLoop'));
                                    break;
                                default:
                                    this.internalSiegeState = ccpwgl.ShipSiegeState.NORMAL;
                                    this.wrappedObjects[j].animation.StopAllAnimations();
                                    this.wrappedObjects[j].animation.PlayAnimation('NormalLoop', true);
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
            }
            else
            {
                if (onswitch)
                {
                    onswitch.call(self, this.siegeState);
                }
            }
        };

        /**
        * Returns an array of ship's locators. Locators hold transforms for various
        * ship mounts (turrets, boosters, etc.). If the ship is not yet loaded the
        * function throws ccpwgl.IsStillLoadingError exception.
        *
        * @throws If the ship's .red file is not yet loaded.
        * @returns {Array} Array of ship locators.
        */
        this.GetLocators = function ()
        {
            if (!this.isLoaded())
            {
                throw new ccpwgl.IsStillLoadingError();
            }
            var result = this.wrappedObjects[0].locators;
            for (var i = 1; i < this.wrappedObjects.length; ++i)
            {
                result = result.concat(this.wrappedObjects[i].locators);
            }
            return result;
        }

        for (var i = 0; i < resPath.length; ++i)
        {
            if (resPath[i].match(/(\w|\d|[-_])+:(\w|\d|[-_])+:(\w|\d|[-_])+/)) {
                if (i == 0)
                    this.dna = resPath[0];
                sof.BuildFromDNA(resPath[i], OnShipPartLoaded(i))
            }
            else {
                ccpwgl_int.resMan.GetObject(resPath[i], OnShipPartLoaded(i));
            }
        }
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
        this.wrappedObjects = [new ccpwgl_int.EvePlanet(), ];
        this.wrappedObjects[0].Create(itemID, planetPath, atmospherePath, heightMap1, heightMap2);
        /** Per-frame on update callback @type {!function(dt): void} **/
        this.onUpdate = null;

        /**
        * Check if planet's resources are loaded and the resulting height map is generated.
        *
        * @returns {boolean} True if planet is loaded; false otherwise.
        */
        this.isLoaded = function () { return this.wrappedObjects[0].hightDirty; };

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
            var tr = this.wrappedObjects[0].highDetail;
            tr.translation[0] = newTransform[12];
            tr.translation[1] = newTransform[13];
            tr.translation[2] = newTransform[14];
            tr.scaling[0] = vec3.length(newTransform);
            tr.scaling[1] = vec3.length(newTransform.subarray(4));
            tr.scaling[2] = vec3.length(newTransform.subarray(8));
            this.wrappedObjects[0].highDetail.localTransform.set(newTransform);
        };

        /**
        * Returns transform matrix from local coordinate space to world.
        *
        * @returns {mat4} Transform matrix.
        */
        this.getTransform = function ()
        {
            return this.wrappedObjects[0].highDetail.localTransform;
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
        /** Current LOD setting @type {ccpwgl.LodSettings} **/
        var lodSetting = ccpwgl.LodSettings.LOD_DISABLED;

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
            this.wrappedScene.planets.splice(0, this.wrappedScene.planets.length);
            this.wrappedScene.objects.splice(0, this.wrappedScene.objects.length);
            for (var i = 0; i < this.objects.length; ++i)
            {
                for (var j = 0; j < this.objects[i].wrappedObjects.length; ++j)
                {
                    if (this.objects[i].wrappedObjects[j])
                    {
                        if (this.objects[i] instanceof Planet)
                        {
                            this.wrappedScene.planets.push(this.objects[i].wrappedObjects[j]);
                        }
                        else
                        {
                            this.wrappedScene.objects.push(this.objects[i].wrappedObjects[j]);
                        }
                    }
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
            obj.EnableLod(lodSetting == ccpwgl.LodSettings.LOD_ENABLED);
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
        * @param {!function(): void} [onload] Optional callback function that is called
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
            if (ship.wrappedObjects[0])
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
            if (object.wrappedObjects[0])
            {
                rebuildSceneObjects.call(this);
            }
            return object;
        };

        /**
        * Adds previously loaded, but removed object back to the scene.
        *
        * @param {ccpwgl.SpaceObject} object Object to add.
        * @returns {ccpwgl.SpaceObject} Object added.
        */
        this.addObject = function (object)
        {
            this.objects.push(object);
            if (object.wrappedObjects[0])
            {
                rebuildSceneObjects.call(this);
            }
            return object;
        }

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
            if (index >= 0 && index < this.objects.length)
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

        /**
        * Returns current LOD setting.
        *
        * @returns {ccpwgl.LodSettings} Current LOD setting.
        */
        this.getLodSetting = function ()
        {
            return lodSetting;
        };

        /**
        * Assigns new LOD setting.
        *
        * @param {ccpwgl.LodSettings} setting New LOD setting.
        */
        this.setLodSetting = function (setting)
        {
            lodSetting = setting;
            if (this.wrappedScene)
            {
                this.wrappedScene.EnableLod(lodSetting == ccpwgl.LodSettings.LOD_ENABLED);
            }
        };
    }

    /**
    * Loads a new scene from .red file and makes it the currect scene (the one that
    * will be automatically updated rendered into the canvas).
    *
    * @param {string} resPath Res path to scene's .red file
    * @param {!function(): void} [onload] Optional callback function that is called
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
    * @param {string|vec4} background Scene background color as RGBA vector or background cubemap res path.
    * @returns {ccpwgl.Scene} Newly constructed scene.
    */
    ccpwgl.createScene = function (background)
    {
        if (background && typeof background != 'string')
        {
            clearColor = background;
        }
        scene = new Scene();
        if (background && typeof background == 'string') {
            var effect = ccpwgl_int.resMan.GetObject('res:/dx9/scene/starfield/starfieldNebula.red', function (obj) {
                scene.wrappedScene.backgroundEffect = obj;
                if ('NebulaMap' in obj.parameters) {
                    obj.parameters['NebulaMap'].resourcePath = background;
                    obj.parameters['NebulaMap'].Initialize();
                }
            });
        }
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
