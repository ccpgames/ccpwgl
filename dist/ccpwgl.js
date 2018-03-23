var ccpwgl = (function(ccpwgl_int)
{
    var ccpwgl = {};
    var vec3 = ccpwgl_int.math.vec3;
    var mat4 = ccpwgl_int.math.mat4;
    
    /**
     * Values for textureQuality option that can be passed to ccpwgl.initialize.
     */
    ccpwgl.TextureQuality = {
        HIGH: 0,
        MEDIUM: 1,
        LOW: 2
    };

    /**
     * Values for textureQuality option that can be passed to ccpwgl.initialize.
     */
    ccpwgl.ShaderQuality = {
        HIGH: 'hi',
        LOW: 'lo'
    };

    /**
     * Resource unload policty. Controls how cached resources are evicted from
     * memory. See ccpwgl.getResourceUnloadPolicy and ccpwgl.setResourceUnloadPolicy.
     * When set to MANUAL you need to call ccpwgl.clearCachedResources function manually
     * from time to time to clear resources from memory cache. When set to USAGE_BASED
     * (default) resources are automatically removed from the cache if they are not used
     * for a specified period of time.
     * It is preferable to use USAGE_BASED, but occasionally this will unload resources
     * when you don't want to (for example if you temporary hide a ship). In such cases
     * you will have to use MANUAL policy and call ccpwgl.clearCachedResources when
     * you know that all resources you need are loaded (see ccpwgl.isLoading).
     */
    ccpwgl.ResourceUnloadPolicy = {
        MANUAL: 0,
        USAGE_BASED: 1
    };

    /**
     * Scene LOD settings: with LOD_ENABLED, scene will not try to render ships/objects that
     * are outside view frustum. Additionally it will hide some parts of ship (like decals)
     * for ships that too far away. Enabling LOD will help performance significantly for
     * scenes with a large number of objects. Defaults to LOD_DISABLED for compatibility.
     */
    ccpwgl.LodSettings = {
        LOD_DISABLED: 0,
        LOD_ENABLED: 1
    };

    /**
     * Turret states
     */
    ccpwgl.TurretState = {
        IDLE: 0,
        OFFLINE: 1,
        FIRING: 2
    };

    /**
     * Ship siege state
     */
    ccpwgl.ShipSiegeState = {
        NORMAL: 0,
        SIEGE: 1
    };

    /**
     * Exception class for objects that can be thrown by ccpwgl.initialize function if
     * WebGL context is not available.
     */
    ccpwgl.NoWebGLError = function()
    {
        this.name = 'NoWebGLError';
        this.message = 'WebGL context is not available';
    };
    ccpwgl.NoWebGLError.prototype = Object.create(Error.prototype);
    ccpwgl.NoWebGLError.prototype.constructor = ccpwgl.NoWebGLError;

    /**
     * Exception that is thrown by some methods when their object .red files is not yet loaded.
     */
    ccpwgl.IsStillLoadingError = function()
    {
        this.name = 'IsStillLoadingError';
        this.message = 'Cannot process the request until the object is loaded';
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
     * Callback that is fired before updating scene state and before any rendering occurs. The dt parameter passed to the
     * function is frame time in seconds.
     * If there is no current scene set this callback is not called.
     * @type {!function(dt): void}
     */
    ccpwgl.onUpdate = null;

    /**
     * Callback that is fired before rendering a scene, but after setting view/projection
     * matrices and clearing the back buffer. Can be used for per-frame update or for
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
     * - webgl2: {boolean} enables webgl2 context creation
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
     * @param {HTMLCanvasElement} canvas HTML Canvas object that is used for WebGL output.
     * @param {Object} params Optional parameters.
     * @returns {number} webgl version (0: none, 1: webgl, 2: webgl2)
     * @throws {NoWebGLError} If WebGL context is not available (IE or older browsers for example).
     */
    ccpwgl.initialize = function(canvas, params)
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

        var glParams = getOption(params, 'glParams',
        {});
        glParams.webgl2 = !params || params.webgl2 === undefined ? false : params.webgl2;

        var webglVersion = d.CreateDevice(canvas, glParams);

        if (!webglVersion) throw new ccpwgl.NoWebGLError();

        d.Schedule(render);
        postprocessingEnabled = getOption(params, 'postprocessing', false);
        if (postprocessingEnabled) postprocess = new ccpwgl_int.Tw2PostProcess();

        function tick()
        {
            d.RequestAnimationFrame(tick);
            d.Tick();
        }

        d.RequestAnimationFrame(tick);

        return webglVersion;
    };

    /**
     * Sets/overrides URLs for resource paths. Resources paths used inside the engine have a
     * format 'namespace:/path' where namespace is usually 'res' which resolves to the
     * Eve Online CDN server and path is a relative path to the resource. You can extend
     * the resource loading by using a different namespace to load some resources from your
     * server. You can also override the default 'res' namespace to load EVE resources from
     * a different server.
     * @example
     * ccpwgl.setResourcePath('myres', 'http://www.myserver.com/resources/');
     * This call will forward all resource paths 'myres:/blah_blah_blah' to
     * http://www.myserver.com/resources/blah_blah_blah.
     *
     * @param {string} namespace Resource namespace.
     * @param {string} path URL to resource root. Needs to have a trailing slash.
     */
    ccpwgl.setResourcePath = function(namespace, path)
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
    ccpwgl.enablePostprocessing = function(enable)
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
    ccpwgl.setCamera = function(newCamera)
    {
        camera = newCamera;
    };

    /**
     * Returns the whole Space Object Factory file.
     * Provides a callback that is called once SOF data has been loaded.
     * @param callback Function that is called when SOF data is ready. Called with a single parameter
     */
    ccpwgl.getSofData = function(callback)
    {
        sof.GetSofData(callback);
    };

    /**
     * Query ship hull names from space object factory database. Along with getSofFactionNames and getSofRaceNames this
     * function can be used to get all supported ship DNA strings (DNA string has a form 'hull:faction:race' that can
     * be passed to loadShip function) to construct 'random' ships. The function is asynchronous so the user needs to
     * provide a callback that is called once SOF data has been loaded.
     * @param callback Function that is called when SOF data is ready. Called with a single parameter that is an mapping
     * of all hull names to their descriptions.
     */
    ccpwgl.getSofHullNames = function(callback)
    {
        sof.GetHullNames(callback);
    };

    /**
     * Query ship faction names from space object factory database. Along with getSofHullNames and getSofRaceNames this
     * function can be used to get all supported ship DNA strings (DNA string has a form 'hull:faction:race' that can
     * be passed to loadShip function) to construct 'random' ships. The function is asynchronous so the user needs to
     * provide a callback that is called once SOF data has been loaded.
     * @param callback Function that is called when SOF data is ready. Called with a single parameter that is an mapping
     * of all faction names to their descriptions.
     */
    ccpwgl.getSofFactionNames = function(callback)
    {
        sof.GetFactionNames(callback);
    };

    /**
     * Query ship race names from space object factory database. Along with getSofHullNames and getSofFactionNames this
     * function can be used to get all supported ship DNA strings (DNA string has a form 'hull:faction:race' that can
     * be passed to loadShip function) to construct 'random' ships. The function is asynchronous so the user needs to
     * provide a callback that is called once SOF data has been loaded.
     * @param callback Function that is called when SOF data is ready. Called with a single parameter that is an mapping
     * of all race names to their descriptions.
     */
    ccpwgl.getSofRaceNames = function(callback)
    {
        sof.GetRaceNames(callback);
    };

    /**
     * Returns a proper constructor function (either 'loadObject' or 'loadShip') appropriate for the given
     * hull name in a callback function.
     * @param hull {string} SOF hull name or full DNA
     * @param callback Function that is called when SOF data is ready. Called with a single parameter that is a
     * constructor name for the given hull.
     */
    ccpwgl.getSofHullConstructor = function(hull, callback)
    {
        sof.GetSofData(function(data)
        {
            var c = hull.indexOf(':');
            if (c > 0)
            {
                hull = hull.substr(0, c);
            }
            var h = data.hull[hull];
            var constructor = null;
            if (h)
            {
                if (h.buildClass == 2)
                {
                    constructor = 'loadObject';
                }
                else
                {
                    constructor = 'loadShip';
                }
            }
            callback(constructor);
        });
    };

    /**
     * Wrapper for static objects (stations, gates, asteroids, clouds, etc.).
     * Created with Scene.loadObject function.
     *
     * @constructor
     * @param {string} resPath Res path to object .red file
     * @param {!function(): void} [onload] Optional callback function that is called
     *   when object .red file is loaded. this will point to SpaceObject instance.
     */
    function SpaceObject(resPath, onload)
    {
        /** Wrapped ccpwgl_int object **/
        this.wrappedObjects = [null];
        /** Local to world space transform matrix @type {mat4} **/
        this.transform = mat4.create();
        /** Per-frame on update callback @type {!function(dt): void} **/
        this.onUpdate = null;
        /** SOF DNA for objects constructed from SOF **/
        this.dna = null;
        /** Array of object overlay effects **/
        this.overlays = [];

        function onObjectLoaded(obj)
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
            rebuildOverlays();
            if (onload)
            {
                onload.call(self);
            }
        }

        var self = this;
        if (resPath.match(/(\w|\d|[-_])+:(\w|\d|[-_])+:(\w|\d|[-_])+/))
        {
            this.dna = resPath;
            sof.BuildFromDNA(resPath, onObjectLoaded);
        }
        else
        {
            ccpwgl_int.resMan.GetObject(resPath, onObjectLoaded);
        }

        /**
         * Check if object .red file is still loading.
         *
         * @returns {boolean} True if object's .red file is loading; false otherwise.
         */
        this.isLoaded = function()
        {
            return this.wrappedObjects[0] != null;
        };

        /**
         * Returns object's bounding sphere if it is available. Throws an exception otherwise.
         *
         * @throws If object is not yet loaded or if object does not have bounding sphere
         * information.
         * @returns {[vec3, float]} Array with first element being sphere position in local
         * coordinate space and second - sphere radius.
         */
        this.getBoundingSphere = function()
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
        this.setTransform = function(newTransform)
        {
            this.transform.set(newTransform);
            if (this.wrappedObjects[0])
            {
                var tr = this.wrappedObjects[0];
                if ('transform' in tr)
                {
                    mat4.copy(tr.transform, this.transform);
                }
                else if ('translation' in tr)
                {
                    mat4.getTranslation(tr.translation, this.transform);
                    mat4.getScaling(tr.scaling, this.transform);
                    //mat4.getRotation(tr.rotation, this.transform);
                }
            }
        };

        /**
         * Returns transform matrix from local coordinate space to world.
         *
         * @returns {mat4} Transform matrix.
         */
        this.getTransform = function()
        {
            return this.transform;
        };

        function rebuildOverlays()
        {
            if (self.wrappedObjects[0])
            {
                self.wrappedObjects[0].overlayEffects = [];
                for (var i = 0; i < self.overlays.length; ++i)
                {
                    if (self.overlays[i].overlay)
                    {
                        self.wrappedObjects[0].overlayEffects.push(self.overlays[i].overlay);
                    }
                }
            }
        }

        /**
         * Adds an overlay effect to the object.
         *
         * @param {string} resPath Resource path to overlay effect.
         * @returns {number} Index of overlay effect; can be used in removeOverlay call.
         */
        this.addOverlay = function(resPath)
        {
            var index = this.overlays.length;
            var overlay = {
                resPath: resPath,
                overlay: null
            };
            this.overlays.push(overlay);
            ccpwgl_int.resMan.GetObject(resPath, function(obj)
            {
                overlay.overlay = obj;
                rebuildOverlays();
            });
            return index;
        };

        /**
         * Removes an overlay effect from the object.
         *
         * @param {number} index Index of overlay effect as returned by addOverlay.
         */
        this.removeOverlay = function(index)
        {
            this.overlays.splice(index, 1);
            rebuildOverlays();
        };

        /**
         * Removes all overlay effects from the object.
         */
        this.removeAllOverlays = function()
        {
            this.overlays.splice(0, this.overlays.length);
            rebuildOverlays();
        }
    }

    /**
     * Wrapper for ships. On top of SpaceObject functionality it provides booster
     * and turret support.
     *
     * @constructor
     * @param {string|string[]} resPath Res path to ship .red file
     * @param {!function(): void} [onload] Optional callback function that is called
     *   when ship .red file is loaded. this will point to Ship instance.
     */
    function Ship(resPath, onload)
    {
        /** Wrapped ccpwgl_int ship object @type {ccpwgl_int.EveShip} **/
        this.wrappedObjects = [null];
        /** Local to world space transform matrix @type {mat4} **/
        this.transform = mat4.create();
        /** Internal boosters object @type {ccpwgl_int.EveBoosterSet} **/
        this.boosters = [null];
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
        /** Array of object overlay effects **/
        this.overlays = [];
        /** Kill counter **/
        this.killCount = 0;
        /** Function to call when turret fires  @type {!function(ship, muzzlePositions): void} **/
        this.turretFireCallback = null;

        var faction = null;

        var self = this;
        if (typeof resPath == 'string')
        {
            resPath = [resPath];
        }
        for (var i = 0; i < resPath.length; ++i)
        {
            this.wrappedObjects[i] = null;
            this.boosters[i] = null;
        }

        function OnShipPartLoaded(index)
        {
            return function(obj)
            {
                self.wrappedObjects[index] = obj;
                if (!(obj instanceof ccpwgl_int.EveShip))
                {
                    self.wrappedObjects[index] = null;
                    console.error('Object loaded with scene.loadShip is not a ship');
                    return;
                }
                self.wrappedObjects[index].transform.set(self.transform);
                if (self.boosters[index])
                {
                    self.wrappedObjects[index].boosters = self.boosters[index];
                    self.wrappedObjects[index].RebuildBoosterSet();
                }
                self.wrappedObjects[index].killCount = self.killCount;
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
                if (self.onInitialSeigeState)
                {
                    self.onInitialSeigeState.call(self, self.siegeState);
                }
                for (var i = 0; i < self.turrets.length; ++i)
                {
                    if (self.turrets[i])
                    {
                        doMountTurret(i, self.turrets[i].path, self.turrets[i].state, self.turrets[i].target, index);
                    }
                }
                if (self.isLoaded())
                {
                    if (self.wrappedObjects.length > 1)
                    {
                        assembleT3Ship();
                    }
                    rebuildOverlays();
                    if (onload)
                    {
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

        function rebuildOverlays()
        {
            if (self.isLoaded())
            {
                for (var j = 0; j < self.wrappedObjects.length; ++j)
                {
                    self.wrappedObjects[j].overlayEffects = [];
                    for (var i = 0; i < self.overlays.length; ++i)
                    {
                        if (self.overlays[i].overlay)
                        {
                            self.wrappedObjects[j].overlayEffects.push(self.overlays[i].overlay);
                        }
                    }
                }
            }
        }

        /**
         * Adds an overlay effect to the object.
         *
         * @param {string} resPath Resource path to overlay effect.
         * @returns {number} Index of overlay effect; can be used in removeOverlay call.
         */
        this.addOverlay = function(resPath)
        {
            var index = this.overlays.length;
            var overlay = {
                resPath: resPath,
                overlay: null
            };
            this.overlays.push(overlay);
            ccpwgl_int.resMan.GetObject(resPath, function(obj)
            {
                overlay.overlay = obj;
                rebuildOverlays();
            });
            return index;
        };

        /**
         * Removes an overlay effect from the object.
         *
         * @param {number} index Index of overlay effect as returned by addOverlay.
         */
        this.removeOverlay = function(index)
        {
            this.overlays.splice(index, 1);
            rebuildOverlays();
        };

        /**
         * Removes all overlay effects from the object.
         */
        this.removeAllOverlays = function()
        {
            this.overlays.splice(0, this.overlays.length);
            rebuildOverlays();
        };

        function assembleT3Ship()
        {
            var systemNames = [
                'electronic',
                'defensive',
                'engineering',
                'offensive',
                'propulsion'
            ];
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
                            if (i == 4)
                            {
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
                self.partTransforms[index] = mat4.create();
                mat4.translate(self.partTransforms[index], self.partTransforms[index], offset);
                vec3.add(offset, offset, systems[i][1]);
                mat4.multiply(self.wrappedObjects[index].transform, self.transform, self.partTransforms[index]);
            }
        }

        /**
         * Check if ship's .red file is still loading.
         *
         * @returns {boolean} True if ship's .red file is loading; false otherwise.
         */
        this.isLoaded = function()
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
        this.getBoundingSphere = function()
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
        this.setTransform = function(newTransform)
        {
            this.transform.set(newTransform);
            var i;
            if (this.wrappedObjects.length < 2 || !this.isLoaded())
            {
                for (i = 0; i < this.wrappedObjects.length; ++i)
                {
                    if (this.wrappedObjects[i])
                    {
                        mat4.copy(this.wrappedObjects[0].transform, this.transform);
                    }
                }
            }
            else
            {
                for (i = 0; i < this.wrappedObjects.length; ++i)
                {
                    mat4.multiply(self.wrappedObjects[i].transform, self.transform, self.partTransforms[i]);
                }
            }
        };

        /**
         * Returns transform matrix from local coordinate space to world.
         *
         * @returns {mat4} Transform matrix.
         */
        this.getTransform = function()
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
        this.loadBoosters = function(resPath, onload)
        {
            var self = this;

            function loaded(index)
            {
                return function(obj)
                {
                    self.boosters[index] = obj;
                    if (self.wrappedObjects[index])
                    {
                        self.wrappedObjects[index].boosters = obj;
                        self.wrappedObjects[index].RebuildBoosterSet();
                    }
                    for (var i = 0; i < self.boosters.length; ++i)
                    {
                        if (!self.boosters)
                        {
                            return;
                        }
                    }
                    if (onload)
                    {
                        onload.call(self);
                    }
                }
            }

            for (var i = 0; i < self.wrappedObjects.length; ++i)
            {
                ccpwgl_int.resMan.GetObject(resPath, loaded(i));
            }
        };

        /**
         * Sets strength of boosters effect.
         *
         * @param {number} boosterStrength Boosters strength from 0 to 1.
         */
        this.setBoosterStrength = function(boosterStrength)
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
         * Set number of kills for the ship (to display on the hull).
         *
         * @param {number} kills Number of kills (from 0).
         */
        this.setKillCount = function(kills)
        {
            this.killCount = kills;
            for (var i = 0; i < self.wrappedObjects.length; ++i)
            {
                if (this.wrappedObjects[i])
                {
                    this.wrappedObjects[i].killCount = kills;
                }
            }
        };

        /**
         * Returns number of turret slots available on the ship.
         *
         * @throws If the ship's .red file is not yet loaded.
         * @returns {number} Number of turret slots.
         */
        this.getTurretSlotCount = function()
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
         * @param {string} resPath Res path to turret .red file.
         */
        this.mountTurret = function(index, resPath)
        {
            this.turrets[index] = {
                path: resPath,
                state: ccpwgl.TurretState.IDLE,
                target: vec3.create()
            };
            if (this.isLoaded())
            {
                doMountTurret(index, resPath, ccpwgl.TurretState.IDLE, this.turrets[index].target);
            }
        };

        /**
         * Removes turret from specified slot.
         *
         * @param {number} index Turret slot to clear.
         */
        this.removeTurret = function(index)
        {
            this.turrets[index] = null;
            if (this.isLoaded())
            {
                var name = 'locator_turret_' + index;
                for (var j = 0; j < this.wrappedObjects.length; ++j)
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
        this.setTurretState = function(index, state)
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
        this.setTurretTargetPosition = function(index, target)
        {
            if (!this.turrets[index])
            {
                throw new ReferenceError('turret at index ' + index + ' is not defined');
            }
            vec3.copy(this.turrets[index].target, target);
            var name = 'locator_turret_' + index;
            for (var j = 0; j < this.wrappedObjects.length; ++j)
            {
                if (this.wrappedObjects[j])
                {
                    for (var i = 0; i < this.wrappedObjects[j].turretSets.length; ++i)
                    {
                        if (this.wrappedObjects[j].turretSets[i].locatorName === name)
                        {
                            vec3.copy(this.wrappedObjects[j].turretSets[i].targetPosition, target);
                            break;
                        }
                    }
                }
            }
        };

        this.getTurretTargetPosition = function(index)
        {
            if (!this.turrets[index])
            {
                throw new ReferenceError('turret at index ' + index + ' is not defined');
            }
            return this.turrets[index].target;
        };

        function fireMissile(missilePath, positions)
        {
            console.error(missilePath);
        }

        /** Internal helper method that mount a turret on a loaded ship **/
        function doMountTurret(slot, resPath, state, targetPosition, objectIndex)
        {
            var name = 'locator_turret_' + slot;
            if (objectIndex === undefined)
            {
                objectIndex = null;
                for (var i = 0; i < self.wrappedObjects.length; ++i)
                {
                    if (self.wrappedObjects[i] && self.wrappedObjects[i].HasLocatorPrefix(name))
                    {
                        objectIndex = i;
                        break;
                    }
                }
                if (objectIndex === null)
                {
                    return;
                }
            }
            else
            {
                if (!self.wrappedObjects[objectIndex].HasLocatorPrefix(name))
                {
                    return;
                }
            }
            var ship = self.wrappedObjects[objectIndex];
            for (i = 0; i < ship.turretSets.length; ++i)
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
                function(object)
                {
                    object.locatorName = name;
                    if (faction)
                    {
                        sof.SetupTurretMaterial(object, faction, faction);
                    }
                    ship.turretSets.push(object);
                    ship.RebuildTurretPositions();
                    object.targetPosition = targetPosition;
                    object.fireCallback = function(turretSet, positions)
                    {
                        if (self.turretFireCallback)
                        {
                            self.turretFireCallback(self, slot, positions);
                        }
                    };
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
         * Sets ship siege state. Some ships support switching between 'normal' and
         * siege state having different animations for these states. This function
         * switches ships animation from one state to another. If the ship .red file
         * is not yet loaded the transition will happen once the file is loaded.
         *
         * @param {ccpwgl.ShipSiegeState} state State to switch to.
         * @param {!function(state): void} onswitch Optional callback function that is called
         *   when animation has switched to the new state. This will point to Ship instance. The
         *   state parameter is the new siege state.
         */
        this.setSiegeState = function(state, onswitch)
        {
            function getOnComplete(index, state, nextAnim)
            {
                return function()
                {
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
        this.GetLocators = function()
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
        };

        var factions = {
            amarr: 'amarrbase',
            caldari: 'caldaribase',
            gallente: 'gallentebase',
            minmatar: 'minmatarbase'
        };

        resPath.sort(function(x, y)
        {
            x = x.toLowerCase();
            y = y.toLowerCase();
            if (x < y)
            {
                return -1;
            }
            if (x > y)
            {
                return 1;
            }
            return 0;
        });
        for (i = 0; i < resPath.length; ++i)
        {
            if (resPath[i].match(/(\w|\d|[-_])+:(\w|\d|[-_])+:(\w|\d|[-_])+/))
            {
                if (i == 0)
                {
                    this.dna = resPath[0];
                    faction = this.dna.split(':')[1];
                }
                sof.BuildFromDNA(resPath[i], OnShipPartLoaded(i))
            }
            else
            {
                ccpwgl_int.resMan.GetObject(resPath[i], OnShipPartLoaded(i));
                if (i == 0)
                {
                    var p = resPath[0].toLowerCase();
                    for (var f in factions)
                    {
                        if (p.indexOf(f) >= 0)
                        {
                            faction = factions[f];
                        }
                    }
                }
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
        this.wrappedObjects = [new ccpwgl_int.EvePlanet()];
        this.wrappedObjects[0].Create(itemID, planetPath, atmospherePath, heightMap1, heightMap2);
        /** Per-frame on update callback @type {!function(dt): void} **/
        this.onUpdate = null;

        /**
         * Check if planet's resources are loaded and the resulting height map is generated.
         *
         * @returns {boolean} True if planet is loaded; false otherwise.
         */
        this.isLoaded = function()
        {
            return !this.wrappedObjects[0].heightDirty;
        };

        /**
         * Returns planets's bounding sphere. We know it always is a unit sphere in local
         * coordinate space.
         *
         * @returns {[vec3, float]} Array with first element being sphere position in local
         * coordinate space and the second it's radius
         */
        this.getBoundingSphere = function()
        {
            var tr = this.wrappedObjects[0].highDetail;
            return [vec3.clone(tr.translation), Math.max(tr.scaling[0], tr.scaling[1], tr.scaling[2])];
        };

        /**
         * Sets transform matrix from local coordinate space to world.
         *
         * @param {mat4} newTransform Transform matrix.
         */
        this.setTransform = function(newTransform)
        {
            var tr = this.wrappedObjects[0].highDetail;
            mat4.getTranslation(tr.translation, newTransform);
            mat4.getScaling(tr.scaling, newTransform);
            mat4.copy(tr.localTransform, newTransform);
        };

        /**
         * Returns transform matrix from local coordinate space to world.
         *
         * @param {mat4} out
         * @returns {mat4} Transform matrix.
         */
        this.getTransform = function(out)
        {
            out = out || mat4.create();
            return mat4.clone(this.wrappedObjects[0].highDetail.localTransform);
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
        function rebuildSceneObjects(self)
        {
            if (!self.wrappedScene)
            {
                return;
            }
            self.wrappedScene.planets.splice(0, self.wrappedScene.planets.length);
            self.wrappedScene.objects.splice(0, self.wrappedScene.objects.length);
            for (var i = 0; i < self.objects.length; ++i)
            {
                for (var j = 0; j < self.objects[i].wrappedObjects.length; ++j)
                {
                    if (self.objects[i].wrappedObjects[j])
                    {
                        if (self.objects[i] instanceof Planet)
                        {
                            self.wrappedScene.planets.push(self.objects[i].wrappedObjects[j]);
                        }
                        else
                        {
                            self.wrappedScene.objects.push(self.objects[i].wrappedObjects[j]);
                        }
                    }
                }
            }
        }

        /**
         * Called when an EveSpaceScene is created or loaded.
         */
        function onSceneLoaded(self, obj)
        {
            self.wrappedScene = obj;
            if (self.sun)
            {
                obj.lensflares[0] = self.sun;
            }
            if (self.sunDirection)
            {
                obj.sunDirection.set(self.sunDirection);
            }
            if (self.sunLightColor)
            {
                obj.sunDiffuseColor.set(self.sunLightColor);
            }
            obj.EnableLod(lodSetting == ccpwgl.LodSettings.LOD_ENABLED);
            if (self.fog)
            {
                obj.fogStart = self.fog[0];
                obj.fogEnd = self.fog[1];
                obj.fogMax = self.fog[2];
                obj.fogColor.set(self.fog[3]);
            }
            rebuildSceneObjects(self);
        }

        /**
         * Creates a new empty scene.
         */
        this.create = function()
        {
            onSceneLoaded(this, new ccpwgl_int.EveSpaceScene());
        };

        /**
         * Loads a scene from .red file.
         *
         * @param {string} resPath Res path to scene .red file
         * @param {!function(): void} onload Optional callback function that is called
         *   when scene .red file is loaded. this will point to Scene instance.
         */
        this.load = function(resPath, onload)
        {
            var self = this;
            ccpwgl_int.resMan.GetObject(
                resPath,
                function(obj)
                {
                    onSceneLoaded(self, obj);
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
        this.isLoaded = function()
        {
            return this.wrappedScene != null;
        };

        /**
         * Loads a ship from .red file and adds it to scene's objects list.
         *
         * @param {string} resPath Res path to ship .red file
         * @param {!function(): void} [onload] Optional callback function that is called
         *   when ship .red file is loaded. this will point to Ship instance.
         * @returns {ccpwgl.Ship} A newly created ship instance.
         */
        this.loadShip = function(resPath, onload)
        {
            var self = this;
            var ship = new Ship(
                resPath,
                function()
                {
                    rebuildSceneObjects(self);
                    if (onload)
                    {
                        onload.call(this);
                    }
                });
            this.objects.push(ship);
            if (ship.wrappedObjects[0])
            {
                rebuildSceneObjects(this);
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
        this.loadObject = function(resPath, onload)
        {
            var self = this;
            var object = new SpaceObject(
                resPath,
                function()
                {
                    rebuildSceneObjects(self);
                    if (onload)
                    {
                        onload.call(this);
                    }
                });
            this.objects.push(object);
            if (object.wrappedObjects[0])
            {
                rebuildSceneObjects(this);
            }
            return object;
        };

        /**
         * Adds previously loaded, but removed object back to the scene.
         *
         * @param {ccpwgl.SpaceObject} object Object to add.
         * @returns {ccpwgl.SpaceObject} Object added.
         */
        this.addObject = function(object)
        {
            this.objects.push(object);
            if (object.wrappedObjects[0])
            {
                rebuildSceneObjects(this);
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
        this.loadPlanet = function(itemID, planetPath, atmospherePath, heightMap1, heightMap2)
        {
            var object = new Planet(itemID, planetPath, atmospherePath, heightMap1, heightMap2);
            this.objects.push(object);
            rebuildSceneObjects(this);
            return object;
        };

        /**
         * Returns object (ship or planet) at a specified index in scene's objects list.
         *
         * @thorws If index is out of bounds.
         * @param {number} index Object index.
         * @returns Object at specified index.
         */
        this.getObject = function(index)
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
        this.indexOf = function(object)
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
        this.removeObject = function(index)
        {
            if (index >= this.objects.length)
            {
                throw new ReferenceError('object index out of bounds');
            }
            this.objects.splice(index, 1);
            rebuildSceneObjects(this);
        };

        /**
         * Loads a sun (a flare) into the scene. Due to some limitations of WebGL there
         * can only be once sun in the scene. It doesn't appear in scene's object list.
         *
         * @param {string} resPath Res path to sun's .red file
         * @param {!function(): void} onload Optional callback function that is called
         *   when sun .red file is loaded. this will point to Scene instance.
         */
        this.loadSun = function(resPath, onload)
        {
            var self = this;
            ccpwgl_int.resMan.GetObject(
                resPath,
                function(obj)
                {
                    self.sun = obj;
                    if (self.wrappedScene)
                    {
                        self.wrappedScene.lensflares[0] = obj;
                    }
                    if (self.sunDirection)
                    {
                        vec3.negate(obj.position, self.sunDirection);
                    }
                    else if (self.wrappedScene)
                    {
                        vec3.negate(obj.position, self.wrappedScene.sunDirection);
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
        this.removeSun = function()
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
        this.setSunDirection = function(direction)
        {
            this.sunDirection = direction;
            if (this.wrappedScene)
            {
                this.wrappedScene.sunDirection.set(this.sunDirection);
            }
            if (this.sun)
            {
                vec3.negate(this.sun.position, direction);
            }
        };

        /**
         * Sets color for the sunlight. This affects lighting on objects.
         *
         * @param {vec3} color Sunlight color as RGB vector.
         */
        this.setSunLightColor = function(color)
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
        this.setFog = function(startDistance, endDistance, maxOpacity, color)
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
        this.getLodSetting = function()
        {
            return lodSetting;
        };

        /**
         * Assigns new LOD setting.
         *
         * @param {ccpwgl.LodSettings} setting New LOD setting.
         */
        this.setLodSetting = function(setting)
        {
            lodSetting = setting;
            if (this.wrappedScene)
            {
                this.wrappedScene.EnableLod(lodSetting == ccpwgl.LodSettings.LOD_ENABLED);
            }
        };
    }

    /**
     * A basic perspective Camera
     * @param {HTMLCanvasElement|Element} element
     * @constructor
     */
    function Camera(element)
    {
        this.distance = 1;
        this.minDistance = -1;
        this.maxDistance = 1000000;
        this.fov = 60;
        this.rotationX = 0;
        this.rotationY = 0;
        this.poi = vec3.create();
        this.nearPlane = 1;
        this.farPlane = 0;

        this.onShift = null;
        this.shift = 0;
        this.shiftStage = 0;
        this._shiftX = null;

        this._dragX = 0;
        this._dragY = 0;
        this._lastRotationX = 0;
        this._lastRotationY = 0;
        this._rotationSpeedX = 0;
        this._rotationSpeedY = 0;
        this._measureRotation = null;
        this._moveEvent = null;
        this._upEvent = null;
        this._prevScale = null;

        this.additionalRotationX = 0;
        this.additionalRotationY = 0;

        var self = this;
        element.addEventListener('mousedown', function (event) { self._DragStart(event); }, false);
        element.addEventListener('touchstart', function (event) { self._DragStart(event); }, true);
        window.addEventListener('DOMMouseScroll', function (e) { return self._WheelHandler(e, element); }, false);
        window.addEventListener('mousewheel', function (e) { return self._WheelHandler(e, element); }, false);

        /**
         * Sets the cameras poi to an object, and adjusts the distance to suit
         *
         * @param {SpaceObject|Ship|Planet} obj
         * @param {number} [distanceMultiplier]
         * @param {number} [minDistance]
         * @returns {boolean}
         */
        this.focus = function (obj, distanceMultiplier, minDistance)
        {
            try
            {
                mat4.getTranslation(this.poi, obj.getTransform());
                this.distance = Math.max(obj.getBoundingSphere()[1] * (distanceMultiplier || 1), (minDistance || 0));
                console.log(this.distance);
                return true;
            }
            catch (err)
            {
                return false;
            }
        };

        /**
         * Gets the camera's view matrix
         * @returns {mat4}
         */
        this.getView = function ()
        {
            var view = mat4.create();
            mat4.identity(view);
            mat4.rotateY(view, view, -this.shift);
            mat4.translate(view, view, [0, 0.0, -this.distance]);
            mat4.rotateX(view, view, this.rotationY + this.additionalRotationY);
            mat4.rotateY(view, view, this.rotationX + this.additionalRotationX);
            mat4.translate(view, view, [-this.poi[0], -this.poi[1], -this.poi[2]]);
            return view;
        };

        /**
         * Gets the cameras projection matrix
         * @param {number} aspect - The canvas's aspect ratio
         * @returns {mat4}
         */
        this.getProjection = function (aspect)
        {
            var fH = Math.tan(this.fov / 360 * Math.PI) * this.nearPlane;
            var fW = fH * aspect;
            return mat4.frustum(mat4.create(), -fW, fW, -fH, fH, this.nearPlane, this.farPlane > 0 ? this.farPlane : this.distance * 2);
        };

        /**
         * Per frame update
         * @param {number} dt - delta time
         */
        this.update = function (dt)
        {
            this.rotationX += this._rotationSpeedX * dt;
            this._rotationSpeedX *= 0.9;
            this.rotationY += this._rotationSpeedY * dt;
            this._rotationSpeedY *= 0.9;
            if (this.rotationY < -Math.PI / 2)
            {
                this.rotationY = -Math.PI / 2;
            }
            if (this.rotationY > Math.PI / 2)
            {
                this.rotationY = Math.PI / 2;
            }
            if (this.shiftStage === 2)
            {
                this.shift += this.shift * dt * 5;
                if (Math.abs(this.shift) > 2)
                {
                    this.onShift(1, this.shift > 0);
                    //this.shift = -this.shift;
                    //this._shiftOut = false;
                }
            }
            else if (this.shiftStage === 1)
            {
                this.shift -= this.shift * Math.min(dt, 0.5) * 2;
            }
        };

        /**
         * Drag start handler
         * @param event
         * @private
         */
        this._DragStart = function (event)
        {
            if (!event.touches && !this.onShift && event.button !== 0)
            {
                return;
            }
            if (this._moveEvent || this._upEvent)
            {
                return;
            }

            var self = this;
            if (this._moveEvent === null)
            {
                document.addEventListener('mousemove', this._moveEvent = function (event) { self._DragMove(event); }, true);
                document.addEventListener('touchmove', this._moveEvent, true);
            }
            if (this._upEvent === null)
            {
                document.addEventListener('mouseup', this._upEvent = function (event) { self._DragStop(event); }, true);
                document.addEventListener('touchend', this._upEvent, true);
            }
            event.preventDefault();
            if (event.touches)
            {
                event.screenX = event.touches[0].screenX;
                event.screenY = event.touches[0].screenY;
            }
            this._dragX = event.screenX;
            this._dragY = event.screenY;
            this._shiftX = null;
            this._rotationSpeedX = 0;
            this._lastRotationX = this.rotationX;
            this._rotationSpeedY = 0;
            this._lastRotationY = this.rotationY;
            this._measureRotation = setTimeout(function () { self._MeasureRotation(); }, 500);
        };

        /**
         * Measures rotation
         * @private
         */
        this._MeasureRotation = function ()
        {
            var self = this;
            this._lastRotationX = this.rotationX;
            this._lastRotationY = this.rotationY;
            this._measureRotation = setTimeout(function () { self._MeasureRotation(); }, 500);
        };

        /**
         * Drag move handler
         * @param event
         * @private
         */
        this._DragMove = function (event)
        {
            var device = ccpwgl_int.device;

            if (this.onShift && (event.touches && event.touches.length > 2 || !event.touches && event.button != 0))
            {
                this.shiftStage = 0;
                event.preventDefault();
                if (event.touches)
                {
                    event.screenX = 0;
                    event.screenY = 0;
                    for (var i = 0; i < event.touches.length; ++i)
                    {
                        event.screenX += event.touches[i].screenX;
                        event.screenY += event.touches[i].screenY;
                    }
                    event.screenX /= event.touches.length;
                    event.screenY /= event.touches.length;
                }
                if (this._shiftX !== null)
                {
                    this.shift += (event.screenX - this._shiftX) / device.viewportWidth * 2;
                }
                this._shiftX = event.screenX;
                return;
            }
            this._shiftX = null;
            if (event.touches)
            {
                if (event.touches.length > 1)
                {
                    event.preventDefault();
                    var dx = event.touches[0].screenX - event.touches[1].screenX;
                    var dy = event.touches[0].screenY - event.touches[1].screenY;
                    var scale = Math.sqrt(dx * dx + dy * dy);
                    if (this._prevScale != null)
                    {
                        var delta = (this._prevScale - scale) * 0.03;
                        this.distance = this.distance + delta * this.distance * 0.1;
                        if (this.distance < this.minDistance)
                        {
                            this.distance = this.minDistance;
                        }
                        if (this.distance > this.maxDistance)
                        {
                            this.distance = this.maxDistance;
                        }
                    }
                    this._prevScale = scale;
                    return;
                }
                event.screenX = event.touches[0].screenX;
                event.screenY = event.touches[0].screenY;
            }
            if (typeof (event.screenX) !== 'undefined')
            {
                var dRotation = -(this._dragX - event.screenX) * 0.01;
                this.rotationX += dRotation;
                this._dragX = event.screenX;
                dRotation = -(this._dragY - event.screenY) * 0.01;
                this.rotationY += dRotation;
                this._dragY = event.screenY;
                if (this.rotationY < -Math.PI / 2)
                {
                    this.rotationY = -Math.PI / 2;
                }
                if (this.rotationY > Math.PI / 2)
                {
                    this.rotationY = Math.PI / 2;
                }
            }
        };

        /**
         * Drag stop handler
         * @param event
         * @private
         */
        this._DragStop = function (event)
        {
            clearTimeout(this._measureRotation);
            document.removeEventListener('mousemove', this._moveEvent, true);
            document.removeEventListener('mouseup', this._upEvent, true);
            document.removeEventListener('touchmove', this._moveEvent, true);
            document.removeEventListener('touchend', this._upEvent, true);
            this._moveEvent = null;
            this._upEvent = null;
            var dRotation = this.rotationX - this._lastRotationX;
            this._rotationSpeedX = dRotation * 0.5;
            dRotation = this.rotationY - this._lastRotationY;
            this._rotationSpeedY = dRotation * 0.5;
            this._prevScale = null;
            if (this.onShift)
            {
                if (Math.abs(this.shift) > 0.5)
                {
                    this.shiftStage = 2;
                    this.onShift(0, this.shift > 0);
                }
                else
                {
                    this.shiftStage = 1;
                }
            }
        };

        /**
         * Mouse wheel handler
         * @param event
         * @param element
         * @returns {boolean}
         * @private
         */
        this._WheelHandler = function (event, element)
        {
            var delta = 0;
            if (!event) /* For IE. */
                event = window.event;
            var source = null;
            if (event.srcElement)
            {
                source = event.srcElement;
            }
            else
            {
                source = event.target;
            }
            if (source !== element)
            {
                return false;
            }
            if (event.wheelDelta)
            { /* IE/Opera. */
                delta = event.wheelDelta / 120;
                /** In Opera 9, delta differs in sign as compared to IE.
                 */
                if (window.opera)
                    delta = -delta;
            }
            else if (event.detail)
            { /** Mozilla case. */
                /** In Mozilla, sign of delta is different than in IE.
                 * Also, delta is multiple of 3.
                 */
                delta = -event.detail / 3;
            }
            /** If delta is nonzero, handle it.
             * Basically, delta is now positive if wheel was scrolled up,
             * and negative, if wheel was scrolled down.
             */
            if (delta)
            {
                this.distance = this.distance + delta * this.distance * 0.1;
                if (this.distance < this.minDistance)
                {
                    this.distance = this.minDistance;
                }
            }
            /** Prevent default actions caused by mouse wheel.
             * That might be ugly, but we handle scrolls somehow
             * anyway, so don't bother here..
             */
            if (event.preventDefault)
                event.preventDefault();
            event.returnValue = false;
            return false;
        };
    }

     /**
     * Creates a camera
     *
     * @param {HTMLCanvasElement|Element} canvas
     * @param {*} [options]
      *@param {boolean} [setAsCurrent]
     * @returns {Camera}
     */
    ccpwgl.createCamera = function (canvas, options, setAsCurrent)
    {
        function get(src, srcAttr, defaultValue)
        {
            return src && srcAttr in src ? src[srcAttr] : defaultValue;
        }

        var camera = new Camera(canvas);
        camera.fov = get(options, 'fov', 30);
        camera.distance = get(options, 'distance', 1000);
        camera.maxDistance = get(options, 'maxDistance', 1000000);
        camera.minDistance = get(options, 'minDistance', 0.6);
        camera.rotationX = get(options, 'rotationX', 0);
        camera.rotationY = get(options, 'rotationY', 0);
        vec3.copy(camera.poi, get(options, 'poi', [0, 0, 0]));
        camera.nearPlane = get(options, 'nearPlane', 1);
        camera.farPlane = get(options, 'farPlane', 1000000);
        camera.minPitch = get(options, 'minPitch', -0.5);
        camera.maxPitch = get(options, 'maxPitch', 0.35);

        if (setAsCurrent)
        {
            ccpwgl.setCamera(camera);
        }

        return camera;
    };

    /**
     * Loads a new scene from .red file and makes it the current scene (the one that
     * will be automatically updated rendered into the canvas).
     *
     * @param {string} resPath Res path to scene's .red file
     * @param {!function(): void} [onload] Optional callback function that is called
     *   when scene .red file is loaded. this will point to Scene instance.
     * @returns {ccpwgl.Scene} Newly constructed scene.
     */
    ccpwgl.loadScene = function(resPath, onload)
    {
        scene = new Scene();
        scene.load(resPath, onload);
        return scene;
    };

    /**
     * Creates a new empty scene. The scene will not have background nebula and will
     * use a solid color to fill the background.
     *
     * @param {string|float[]} background Scene background color as RGBA vector or background cubemap res path.
     * @returns {ccpwgl.Scene} Newly constructed scene.
     */
    ccpwgl.createScene = function(background)
    {
        if (background && typeof background != 'string')
        {
            clearColor = background;
        }
        scene = new Scene();
        if (background && typeof background == 'string')
        {
            ccpwgl_int.resMan.GetObject('res:/dx9/scene/starfield/starfieldNebula.red', function(obj)
            {
                scene.wrappedScene.backgroundEffect = obj;
                if ('NebulaMap' in obj.parameters)
                {
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
    ccpwgl.isLoading = function()
    {
        return ccpwgl_int.resMan.IsLoading();
    };

    /**
     * Returns a count of how many resources are still loading.
     *
     * @returns {number} Pending resource loads
     */
    ccpwgl.getPendingLoads = function()
    {
        return ccpwgl_int.resMan._pendingLoads;
    };

    /**
     * Enable/disable scene per-frame updates.
     *
     * @param {boolean} enable If true scene update and update callbacks are called
     *   every frame.
     */
    ccpwgl.enableUpdate = function(enable)
    {
        updateEnabled = enable;
    };

    /**
     * Enable/disable scene rendering.
     *
     * @param {boolean} enable If true scene is rendered into the canvas.
     */
    ccpwgl.enableRendering = function(enable)
    {
        renderingEnabled = enable;
    };

    /**
     * Returns current resource unload policy.
     *
     * @returns {ccpwgl.ResourceUnloadPolicy} Current resource unload policy.
     */
    ccpwgl.getResourceUnloadPolicy = function()
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
    ccpwgl.setResourceUnloadPolicy = function(policy, timeout)
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
    ccpwgl.clearCachedResources = function()
    {
        ccpwgl_int.resMan.Clear();
    };

    return ccpwgl;
}(ccpwgl_int || window));
