import {num, vec3, vec4, mat4} from '../math';
import {store} from './Tw2Store';
import {resMan} from './Tw2ResMan';
import {Tw2Effect} from '../../core/mesh/Tw2Effect';
import {Tw2VertexDeclaration} from '../../core/vertex';
import {Tw2EventEmitter} from '../../core/Tw2EventEmitter';

const WebGLDebugUtil = require('webgl-debug');

/**
 * Tw2Device
 *
 * @property {?WebGLRenderingContext|*} gl         - The device's gl context
 * @property {?number} glVersion                   - The device's gl version
 * @property {?VRDisplay} vrDisplay                - An optional VRDisplay context
 * @property {?{}} ext                             - An object containing compatibility extensions
 * @property {boolean} debugMode                   - Toggles debug mode
 * @property {?{}} debugUtils                      - Webgl debug utils
 * @property {number} dt                           - Clock delta time
 * @property {number} startTime                    - Clock start time
 * @property {number} currentTime                  - Clock current time
 * @property {?number} previousTime                - Clock previous time
 * @property {vec3} eyePosition                    - The device's current eye position
 * @property {vec4} targetResolution               - The device's current target resolution
 * @property {mat4} world                          - The device's current world matrix
 * @property {mat4} view                           - The device's current view matrix
 * @property {mat4} viewInverse                    - The device's current inverse view matrix
 * @property {mat4} viewTranspose                  - The device's current view matrix transposed
 * @property {mat4} projection                     - The device's current projection matrix
 * @property {mat4} projectionInverse              - The device's current inverse projection matrix
 * @property {mat4} projectionTranspose            - The device's current projection matrix transposed
 * @property {mat4} viewProjection                 - The device's current view projection matrix
 * @property {mat4} viewProjectionTranspose        - The device's current view projection matrix transposed
 * @property {?HTMLCanvasElement} canvas           - The html canvas the gl context was created from
 * @property {number} viewportWidth                - The canvas's current width
 * @property {number} viewportHeight               - The canvas's current height
 * @property {number} viewportAspect               - The canvas's current display aspect
 * @property {number} viewportPixelRatio           - The canvas's pixel ratio
 * @property {string} effectDir                    - The directory used to translate ccp effect file paths
 * @property {number} mipLevelSkipCount            - Controls what quality ccp texture resource to load (mutates paths)
 * @property {string} shaderModel                  - Controls what quality ccp effect resource to load (mutates paths)
 * @property {boolean} enableAnisotropicFiltering  - Enables anisotropic filtering
 * @property {boolean} alphaBlendBackBuffer        - Enables alpha blending (glParams.alpha)
 * @property {boolean} antialiasing                - Identifies if antialiasing is enabled
 * @property {number} msaaSamples                  - The amount of samples used for antialiasing
 * @property {number[]} wrapModes                  - texture wrap modes
 * @property {*} shadowHandles                     - unused
 * @property {Tw2PerObjectData} perObjectData      - The current frame's per object data
 * @property {?{}} _alphaBlendState                - Alpha states for blending
 * @property {?{}} _alphaTestState                 - Alpha test states
 * @property {?{}} _depthOffsetState               - Depth states
 * @property {?Array<number>} _blendTable          - Webgl blend enum table
 * @property {?Float32Array} _shadowStateBuffer    - unused
 * @property {Array<Function>} _scheduled          - Functions that are scheduled to be called per frame
 * @property {WebGLBuffer} _quadBuffer             - Webgl buffer for full screen quad
 * @property {Tw2VertexDeclaration} _quadDecl      - Quad vertex declarations
 * @property {WebGLBuffer} _cameraQuadBuffer       - Webgl buffer for camera space quad
 * @property {number} _currentRenderMode           - The device's current render mode
 * @property {WebGLTexture} _fallbackCube          - A fallback cube texture
 * @property {WebGLTexture} _fallbackTexture       - A fallback texture
 * @property {Tw2Effect} _blitEffect               - The blit effect used for rendering textures
 * @property {?Function} _onResize                 - An optional function which is called when the canvas resizes
 * @class
 */
export class Tw2Device extends Tw2EventEmitter
{
    constructor()
    {
        super();
        this.gl = null;
        this.glVersion = Tw2Device.WebglVersion.NONE;
        this.vrDisplay = null;
        this.ext = null;

        this.debugMode = false;
        this.debugUtils = null;

        this.dt = 0;
        this.frameCounter = 0;
        this.startTime = this.Now();
        this.currentTime = this.startTime;
        this.previousTime = null;

        this.eyePosition = vec3.create();
        this.targetResolution = vec4.create();
        this.world = mat4.create();
        this.view = mat4.create();
        this.viewInverse = mat4.create();
        this.viewTranspose = mat4.create();
        this.projection = mat4.create();
        this.projectionInverse = mat4.create();
        this.projectionTranspose = mat4.create();
        this.viewProjection = mat4.create();
        this.viewProjectionTranspose = mat4.create();

        this.canvas = null;
        this.viewportWidth = 0;
        this.viewportHeight = 0;
        this.viewportAspect = 0;
        this.viewportPixelRatio = 'devicePixelRatio' in window ? window.devicePixelRatio : 1;

        this.effectDir = '/effect.gles2/';
        this.mipLevelSkipCount = 0;
        this.shaderModel = 'hi';
        this.enableAnisotropicFiltering = true;
        this.alphaBlendBackBuffer = true;

        this.antialiasing = true;
        this.msaaSamples = 0;
        this.wrapModes = [];
        this.shadowHandles = null;
        this.perObjectData = null;

        this._alphaBlendState = null;
        this._alphaTestState = null;
        this._depthOffsetState = null;
        this._blendTable = null;
        this._shadowStateBuffer = null;
        this._scheduled = [];
        this._quadBuffer = null;
        this._quadDecl = null;
        this._cameraQuadBuffer = null;
        this._currentRenderMode = this.RM_ANY;
        this._fallbackCube = null;
        this._fallbackTexture = null;
        this._blitEffect = null;
        this._onResize = null;
    }

    /**
     * Gets the current device time
     * @returns {number}
     */
    Now()
    {
        return this.constructor.Clock.now();
    }

    /**
     * Creates webgl Device
     * @param {HTMLCanvasElement} canvas - The html canvas to create a webgl rendering context from
     * @param {{}} [params]              - Optional gl parameters
     * @param {boolean} [params.webgl2]  - Optional flag to enable a webgl2 rendering context
     * @returns {number}                 - The webgl rendering context create (0 if failed)
     */
    CreateDevice(canvas, params)
    {
        this.gl = null;
        this.glVersion = Tw2Device.WebglVersion.NONE;
        this.effectDir = '/effect.gles2/';

        // Try webgl2 if enabled
        if (params && params.webgl2)
        {
            this.gl = Tw2Device.CreateContext(canvas, params, Tw2Device.Webgl2ContextNames);
            if (this.gl) this.glVersion = Tw2Device.WebglVersion.WEBGL2;
        }
        // Fallback to webgl
        if (!this.gl)
        {
            this.gl = Tw2Device.CreateContext(canvas, params, Tw2Device.WebglContextNames);
            if (this.gl) this.glVersion = Tw2Device.WebglVersion.WEBGL;
        }

        const
            returnFalse = () =>
            {
                return false;
            },
            returnTrue = () =>
            {
                return true;
            },
            gl = this.gl;

        this.ext = {
            drawElementsInstanced: returnFalse,
            drawArraysInstanced: returnFalse,
            vertexAttribDivisor: returnFalse,
            hasInstancedArrays: returnFalse
        };

        switch (this.glVersion)
        {
            case Tw2Device.WebglVersion.WEBGL2:
                this.ext = {
                    drawElementsInstanced: function (mode, count, type, offset, instanceCount)
                    {
                        gl.drawElementsInstanced(mode, count, type, offset, instanceCount);
                    },
                    drawArraysInstanced: function (mode, first, count, instanceCount)
                    {
                        gl.drawArraysInstanced(mode, first, count, instanceCount);
                    },
                    vertexAttribDivisor: function (location, divisor)
                    {
                        gl.vertexAttribDivisor(location, divisor);
                    },
                    hasInstancedArrays: returnTrue
                };
                break;

            case Tw2Device.WebglVersion.WEBGL:
                this.GetExtension('OES_standard_derivatives');
                this.GetExtension('OES_element_index_uint');
                this.GetExtension('OES_texture_float');
                this.GetExtension('EXT_shader_texture_lod');
                const instancedArrays = this.GetExtension('ANGLE_instanced_arrays');
                if (instancedArrays)
                {
                    this.ext = {
                        drawElementsInstanced: function (mode, count, type, offset, instanceCount)
                        {
                            instancedArrays['drawElementsInstancedANGLE'](mode, count, type, offset, instanceCount);
                        },
                        drawArraysInstanced: function (mode, first, count, instanceCount)
                        {
                            instancedArrays['drawArraysInstancedANGLE'](mode, first, count, instanceCount);
                        },
                        vertexAttribDivisor: function (location, divisor)
                        {
                            instancedArrays['vertexAttribDivisorANGLE'](location, divisor);
                        },
                        hasInstancedArrays: returnTrue
                    };
                }
                break;

            default:
                return this.glVersion;
        }

        if (gl && this.debugMode)
        {
            this.debugUtils = WebGLDebugUtil;
            this.gl = this.debugUtils.makeDebugContext(gl);
        }

        this.emit('created', {
            gl, params, canvas,
            log: {
                type: 'debug',
                message: `Webgl${this.glVersion} context created`,
            }
        });

        // Optional extensions
        this.ext.CompressedTexture = this.GetExtension('compressed_texture_s3tc');
        this.ext.AnisotropicFilter = this.GetExtension('EXT_texture_filter_anisotropic');
        if (this.ext.AnisotropicFilter)
        {
            this.ext.AnisotropicFilter.maxAnisotropy =
                gl.getParameter(this.ext.AnisotropicFilter['MAX_TEXTURE_MAX_ANISOTROPY_EXT']);
        }

        // CCP mobile shader binary (is this depreciated?)
        const shaderBinary = this.GetExtension('CCP_shader_binary');
        if (shaderBinary)
        {
            const
                renderer = gl.getParameter(this.gl.RENDERER),
                maliVer = renderer.match(/Mali-(\w+).*/);

            if (maliVer)
            {
                this.effectDir = '/effect.gles2.mali' + maliVer[1] + '/';
                this.ext.ShaderBinary = shaderBinary;
            }
        }

        // Quality
        this.alphaBlendBackBuffer = !params || params['alpha'] === undefined || params['alpha'];
        this.msaaSamples = this.gl.getParameter(this.gl.SAMPLES);
        this.antialiasing = this.msaaSamples > 1;

        this.canvas = canvas;
        this.Resize();

        const vertices = [
            1.0, 1.0, 0.0, 1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 1.0, 0.0, 1.0,
            1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 0.0, 0.0
        ];

        this._quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this._cameraQuadBuffer = gl.createBuffer();
        this._quadDecl = new Tw2VertexDeclaration([
            ['POSITION', 0, 4],
            ['TEXCOORD', 0, 2]
        ]);

        this._alphaTestState = {
            dirty: false,
            states: {
                [this.RS_ALPHATESTENABLE]: 0,
                [this.RS_ALPHAREF]: -1,
                [this.RS_ALPHAFUNC]: this.CMP_GREATER,
                [this.RS_CLIPPING]: 0,
                [this.RS_CLIPPLANEENABLE]: 0
            }
        };

        this._alphaBlendState = {
            dirty: false,
            states: {
                [this.RS_SRCBLEND]: this.BLEND_SRCALPHA,
                [this.RS_DESTBLEND]: this.BLEND_INVSRCALPHA,
                [this.RS_BLENDOP]: this.BLENDOP_ADD,
                [this.RS_SEPARATEALPHABLENDENABLE]: 0,
                [this.RS_BLENDOPALPHA]: this.BLENDOP_ADD,
                [this.RS_SRCBLENDALPHA]: this.BLEND_SRCALPHA,
                [this.RS_DESTBLENDALPHA]: this.BLEND_INVSRCALPHA
            }
        };

        this._depthOffsetState = {
            dirty: false,
            states: {
                [this.RS_SLOPESCALEDEPTHBIAS]: 0,
                [this.RS_DEPTHBIAS]: 0
            }
        };

        this.wrapModes = [
            0,
            gl.REPEAT,
            gl.MIRRORED_REPEAT,
            gl.CLAMP_TO_EDGE,
            gl.CLAMP_TO_EDGE,
            gl.CLAMP_TO_EDGE
        ];

        this._shadowStateBuffer = new Float32Array(24);

        // webgl to direct 3d blend table
        this._blendTable = [
            -1,                         // --
            gl.ZERO,                    // D3DBLEND_ZERO
            gl.ONE,                     // D3DBLEND_ONE
            gl.SRC_COLOR,               // D3DBLEND_SRCCOLOR
            gl.ONE_MINUS_SRC_COLOR,     // D3DBLEND_INVSRCCOLOR
            gl.SRC_ALPHA,               // D3DBLEND_SRCALPHA
            gl.ONE_MINUS_SRC_ALPHA,     // D3DBLEND_INVSRCALPHA
            gl.DST_ALPHA,               // D3DBLEND_DESTALPHA
            gl.ONE_MINUS_DST_ALPHA,     // D3DBLEND_INVDESTALPHA
            gl.DST_COLOR,               // D3DBLEND_DESTCOLOR
            gl.ONE_MINUS_DST_COLOR,     // D3DBLEND_INVDESTCOLOR
            gl.SRC_ALPHA_SATURATE,      // D3DBLEND_SRCALPHASAT
            -1,                         // D3DBLEND_BOTHSRCALPHA
            -1,                         // D3DBLEND_BOTHINVSRCALPHA
            gl.CONSTANT_COLOR,          // D3DBLEND_BLENDFACTOR
            gl.ONE_MINUS_CONSTANT_COLOR // D3DBLEND_INVBLENDFACTOR
        ];

        return this.glVersion;
    }

    /**
     * Schedules a function to be called per tick
     * @param {Function} func
     */
    Schedule(func)
    {
        if (!this._scheduled.includes(func))
        {
            this._scheduled.push(func);
        }
    }

    /**
     * Sets a callback which is fired on canvas resizing
     * @param {Function} func
     */
    OnResize(func)
    {
        this._onResize = func;
    }

    /**
     * Handles resize events
     */
    Resize()
    {
        const vrEnabled = this.vrDisplay && this.vrDisplay['isPresenting'];
        if (vrEnabled)
        {
            const
                leftEye = this.vrDisplay['getEyeParameters']('left'),
                rightEye = this.vrDisplay['getEyeParameters']('right');

            this.canvas.width = Math.max(leftEye['renderWidth'], rightEye['renderWidth']) * 2;
            this.canvas.height = Math.max(rightEye['renderHeight'], rightEye['renderHeight']);
        }
        else
        {
            this.canvas.width = this.canvas.offsetWidth * this.viewportPixelRatio;
            this.canvas.height = this.canvas.offsetHeight * this.viewportPixelRatio;
        }

        this.viewportWidth = this.canvas.clientWidth;
        this.viewportHeight = this.canvas.clientHeight;
        this.viewportAspect = this.viewportWidth / this.viewportHeight;

        if (this._onResize)
        {
            this._onResize(this.viewportWidth, this.viewportHeight);
        }

        store.SetVariableValue('ViewportSize', [
            this.viewportWidth,
            this.viewportHeight,
            this.viewportWidth,
            this.viewportHeight
        ]);

        this.emit('resized', {
            width: this.viewportWidth,
            height: this.viewportHeight,
            aspect: this.viewportAspect,
            source: vrEnabled ? this.vrDisplay : this.canvas
        });
    }

    /**
     * Per frame Tick
     */
    Tick()
    {
        if (this.canvas.clientWidth !== this.viewportWidth || this.canvas.clientHeight !== this.viewportHeight)
        {
            this.Resize();
        }

        const
            previousTime = this.previousTime === null ? 0 : this.previousTime,
            now = this.Now();

        this.currentTime = (now - this.startTime) * 0.001;
        this.dt = this.previousTime === null ? 0 : (now - this.previousTime) * 0.001;
        this.previousTime = now;

        store.SetVariableValue('Time', [
            this.currentTime,
            this.currentTime - Math.floor(this.currentTime),
            this.frameCounter,
            previousTime
        ]);

        this.emit('tick', {
            dt: this.dt,
            previous: previousTime,
            current: this.currentTime,
            frame: this.frameCounter
        });

        resMan.PrepareLoop(this.dt);

        for (let i = 0; i < this._scheduled.length; ++i)
        {
            if (!this._scheduled[i](this.dt))
            {
                this._scheduled.splice(i, 1);
                --i;
            }
        }

        this.frameCounter++;
    }

    /**
     * Requests an animation frame
     * @param {Function} func
     * @returns {number}
     */
    RequestAnimationFrame(func)
    {
        return this.vrDisplay ? this.vrDisplay.requestAnimationFrame(func) : Tw2Device.RequestAnimationFrame(func);
    }

    /**
     * Sets World transform matrix
     * @param {mat4} matrix
     */
    SetWorld(matrix)
    {
        mat4.copy(this.world, matrix);
        //mat4.inverse(this.worldInverse, this.world);
    }

    /**
     * Sets view matrix
     * @param {mat4} matrix
     */
    SetView(matrix)
    {
        mat4.copy(this.view, matrix);
        mat4.invert(this.viewInverse, this.view);
        mat4.transpose(this.viewTranspose, this.view);
        mat4.getTranslation(this.eyePosition, this.viewInverse);
        this.UpdateViewProjection();
    }

    /**
     * Sets projection matrix
     * @param {mat4} matrix
     * @param {boolean} [forceUpdateViewProjection]
     */
    SetProjection(matrix, forceUpdateViewProjection)
    {
        mat4.copy(this.projection, matrix);
        mat4.transpose(this.projectionTranspose, this.projection);
        mat4.invert(this.projectionInverse, this.projection);
        this.GetTargetResolution(this.targetResolution);
        if (forceUpdateViewProjection) this.UpdateViewProjection();
    }

    /**
     * Updates view projection matrices
     */
    UpdateViewProjection()
    {
        mat4.multiply(this.viewProjection, this.projection, this.view);
        mat4.transpose(this.viewProjectionTranspose, this.viewProjection);
        store.SetVariableValue('ViewProjectionMat', this.viewProjection);
    }

    /**
     * Gets the device's target resolution
     * @param {vec4} [out=vec4.create()]
     * @returns {vec4} out
     */
    GetTargetResolution(out = vec4.create())
    {
        const aspectRatio = this.projection[0] ? this.projection[5] / this.projection[0] : 0.0;
        let aspectAdjustment = 1.0;
        if (aspectRatio > 1.6) aspectAdjustment = aspectRatio / 1.6;
        const fov = 2.0 * Math.atan(aspectAdjustment / this.projection[5]);
        out[0] = this.viewportWidth;
        out[1] = this.viewportHeight;
        out[2] = fov;
        out[3] = fov * aspectRatio;
        return out;
    }

    /**
     * GetEyePosition
     * @param {vec3} [out=vec3.create()]
     * @return {vec3}
     */
    GetEyePosition(out = vec3.create())
    {
        return vec3.copy(out, this.eyePosition);
    }

    /**
     * Returns whether or not Alpha Test is enabled
     * return {Boolean}
     */
    IsAlphaTestEnabled()
    {
        return this._alphaTestState.states[this.RS_ALPHATESTENABLE];
    }

    /**
     * Checks if a frame buffer is complete
     *
     * @param frameBuffer
     * @returns {boolean}
     */
    IsFrameBufferComplete(frameBuffer)
    {
        return this.gl.checkFramebufferStatus(frameBuffer) === this.gl.FRAMEBUFFER_COMPLETE;
    }

    /**
     * Gets a gl extension
     * @param {string} extension - The gl extension name
     * @returns{*}
     */
    GetExtension(extension)
    {
        const prefixes = Tw2Device.WebglVendorPrefixes;
        for (let prefix in prefixes)
        {
            if (prefixes.hasOwnProperty(prefix))
            {
                const ext = this.gl.getExtension(prefixes[prefix] + extension);
                if (ext) return ext;
            }
        }

        return null;
    }

    /**
     * Gets a fallback texture
     * @returns {*}
     */
    GetFallbackTexture()
    {
        if (!this._fallbackTexture)
        {
            this._fallbackTexture = this.CreateSolidTexture();
        }
        return this._fallbackTexture;
    }

    /**
     * Gets a fallback cube map
     * @returns {*}
     */
    GetFallbackCubeMap()
    {
        if (!this._fallbackCube)
        {
            this._fallbackCube = this.CreateSolidCube();
        }
        return this._fallbackCube;
    }

    /**
     * Creates a solid colored texture
     * @param {vec4|Array} [rgba] - The colour to create, if omitted defaults to completely transparent
     * @returns {WebGLTexture}
     */
    CreateSolidTexture(rgba = [0, 0, 0, 0])
    {
        const
            gl = this.gl,
            texture = this.gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(rgba));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    }

    /**
     * Creates a solid coloured cube texture
     * @param {vec4|Array} rgba
     * @returns {WebGLTexture}
     */
    CreateSolidCube(rgba = [0, 0, 0, 0])
    {
        const
            gl = this.gl,
            texture = this.gl.createTexture();

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        for (let j = 0; j < 6; ++j)
        {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(rgba));
        }
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        //gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        return texture;
    }

    /**
     * RenderFullScreenQuad
     * @param {Tw2Effect} effect
     * @param {string} technique - Technique name
     * @returns {boolean}
     */
    RenderFullScreenQuad(effect, technique = 'Main')
    {
        if (!effect || !effect.IsGood()) return false;

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
        for (let pass = 0; pass < effect.GetPassCount(technique); ++pass)
        {
            effect.ApplyPass(technique, pass);
            if (!this._quadDecl.SetDeclaration(effect.GetPassInput(technique, pass), 24)) return false;
            this.ApplyShadowState();
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        return true;
    }

    /**
     * Renders a Texture to the screen
     * @param {WebGLTexture} texture
     * @returns {boolean}
     */
    RenderTexture(texture)
    {
        if (this._blitEffect === null)
        {
            this._blitEffect = Tw2Effect.create({
                effectFilePath: 'res:/graphics/effect/managed/space/system/blit.fx',
                textures: {
                    BlitSource: ''
                }
            });
        }

        this._blitEffect.parameters['BlitSource'].textureRes = texture;
        return this.RenderFullScreenQuad(this._blitEffect);
    }

    /**
     * RenderCameraSpaceQuad
     * @param {Tw2Effect} effect
     * @param {string} technique - Technique name
     * @returns {boolean}
     */
    RenderCameraSpaceQuad(effect, technique = 'Main')
    {
        if (!effect || !effect.IsGood()) return false;

        const vertices = new Float32Array([
            1.0, 1.0, 0.0, 1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 1.0, 0.0, 1.0,
            1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 0.0, 0.0
        ]);

        const projInv = this.projectionInverse;
        for (let i = 0; i < 4; ++i)
        {
            const vec = vertices.subarray(i * 6, i * 6 + 4);
            vec4.transformMat4(vec, vec, projInv);
            vec3.scale(vec, vec, 1 / vec[3]);
            vec[3] = 1;
        }

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._cameraQuadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        for (let pass = 0; pass < effect.GetPassCount(technique); ++pass)
        {
            effect.ApplyPass(technique, pass);
            if (!this._quadDecl.SetDeclaration(effect.GetPassInput(technique, pass), 24)) return false;
            this.ApplyShadowState();
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        return true;
    }

    /**
     * Set a render state
     * @param state
     * @param value
     */
    SetRenderState(state, value)
    {
        this._currentRenderMode = this.RM_ANY;
        const gl = this.gl;

        switch (state)
        {
            case this.RS_ZENABLE:
                if (value)
                {
                    gl.enable(gl.DEPTH_TEST);
                }
                else
                {
                    gl.disable(gl.DEPTH_TEST);
                }
                return;

            case this.RS_ZWRITEENABLE:
                gl.depthMask(!!value);
                return;

            case this.RS_ALPHATESTENABLE:
            case this.RS_ALPHAREF:
            case this.RS_ALPHAFUNC:
            case this.RS_CLIPPING:
            case this.RS_CLIPPLANEENABLE:
                if (this._alphaTestState[state] !== value)
                {
                    this._alphaTestState.states[state] = value;
                    this._alphaTestState.dirty = true;
                }
                return;

            case this.RS_SRCBLEND:
            case this.RS_DESTBLEND:
            case this.RS_BLENDOP:
            case this.RS_SEPARATEALPHABLENDENABLE:
            case this.RS_BLENDOPALPHA:
            case this.RS_SRCBLENDALPHA:
            case this.RS_DESTBLENDALPHA:
                if (this._alphaBlendState[state] !== value)
                {
                    this._alphaBlendState.states[state] = value;
                    this._alphaBlendState.dirty = true;
                }
                return;

            case this.RS_CULLMODE:
                switch (value)
                {
                    case this.CULL_NONE:
                        gl.disable(gl.CULL_FACE);
                        return;

                    case this.CULL_CW:
                        gl.enable(gl.CULL_FACE);
                        gl.cullFace(gl.FRONT);
                        return;

                    case this.CULL_CCW:
                        gl.enable(gl.CULL_FACE);
                        gl.cullFace(gl.BACK);
                        return;
                }
                return;

            case this.RS_ZFUNC:
                gl.depthFunc(0x0200 + value - 1);
                return;

            case this.RS_ALPHABLENDENABLE:
                if (value) gl.enable(gl.BLEND);
                else gl.disable(gl.BLEND);
                return;

            case this.RS_COLORWRITEENABLE:
                gl.colorMask((value & 1) !== 0, (value & 2) !== 0, (value & 4) !== 0, (value & 8) !== 0);
                return;

            case this.RS_SCISSORTESTENABLE:
                if (value) gl.enable(gl.SCISSOR_TEST);
                else gl.disable(gl.SCISSOR_TEST);
                return;

            case this.RS_SLOPESCALEDEPTHBIAS:
            case this.RS_DEPTHBIAS:
                value = num.dwordToFloat(value);
                if (this._depthOffsetState[state] !== value)
                {
                    this._depthOffsetState.states[state] = value;
                    this._depthOffsetState.dirty = true;
                }
                return;
        }
    }

    /**
     * ApplyShadowState
     */
    ApplyShadowState()
    {
        const gl = this.gl;

        if (this._alphaBlendState.dirty)
        {
            let blendOp = gl.FUNC_ADD;
            if (this._alphaBlendState.states[this.RS_BLENDOP] === this.BLENDOP_SUBTRACT)
            {
                blendOp = gl.FUNC_SUBTRACT;
            }
            else if (this._alphaBlendState.states[this.RS_BLENDOP] === this.BLENDOP_REVSUBTRACT)
            {
                blendOp = gl.FUNC_REVERSE_SUBTRACT;
            }

            const
                srcBlend = this._blendTable[this._alphaBlendState.states[this.RS_SRCBLEND]],
                destBlend = this._blendTable[this._alphaBlendState.states[this.RS_DESTBLEND]];

            if (this._alphaBlendState.states[this.RS_SEPARATEALPHABLENDENABLE])
            {
                let blendOpAlpha = gl.FUNC_ADD;
                if (this._alphaBlendState.states[this.RS_BLENDOP] === this.BLENDOP_SUBTRACT)
                {
                    blendOpAlpha = gl.FUNC_SUBTRACT;
                }
                else if (this._alphaBlendState.states[this.RS_BLENDOP] === this.BLENDOP_REVSUBTRACT)
                {
                    blendOpAlpha = gl.FUNC_REVERSE_SUBTRACT;
                }

                const
                    srcBlendAlpha = this._blendTable[this._alphaBlendState.states[this.RS_SRCBLENDALPHA]],
                    destBlendAlpha = this._blendTable[this._alphaBlendState.states[this.RS_DESTBLENDALPHA]];

                gl.blendEquationSeparate(blendOp, blendOpAlpha);
                gl.blendFuncSeparate(
                    srcBlend,
                    destBlend,
                    srcBlendAlpha,
                    destBlendAlpha
                );
            }
            else
            {
                gl.blendEquation(blendOp);
                gl.blendFunc(srcBlend, destBlend);
            }
            this._alphaBlendState.dirty = false;
        }

        if (this._depthOffsetState.dirty)
        {
            gl.polygonOffset(
                this._depthOffsetState.states[this.RS_SLOPESCALEDEPTHBIAS],
                this._depthOffsetState.states[this.RS_DEPTHBIAS]);
            this._depthOffsetState.dirty = false;
        }

        let alphaTestFunc,
            invertedAlphaTest,
            alphaTestRef;

        if (this.shadowHandles && this._alphaTestState.states[this.RS_ALPHATESTENABLE])
        {
            switch (this._alphaTestState.states[this.RS_ALPHAFUNC])
            {
                case this.CMP_NEVER:
                    alphaTestFunc = 0;
                    invertedAlphaTest = 1;
                    alphaTestRef = -256;
                    break;

                case this.CMP_LESS:
                    alphaTestFunc = 0;
                    invertedAlphaTest = -1;
                    alphaTestRef = this._alphaTestState.states[this.RS_ALPHAREF] - 1;
                    break;

                case this.CMP_EQUAL:
                    alphaTestFunc = 1;
                    invertedAlphaTest = 0;
                    alphaTestRef = this._alphaTestState.states[this.RS_ALPHAREF];
                    break;

                case this.CMP_LEQUAL:
                    alphaTestFunc = 0;
                    invertedAlphaTest = -1;
                    alphaTestRef = this._alphaTestState.states[this.RS_ALPHAREF];
                    break;

                case this.CMP_GREATER:
                    alphaTestFunc = 0;
                    invertedAlphaTest = 1;
                    alphaTestRef = -this._alphaTestState.states[this.RS_ALPHAREF] - 1;
                    break;

                /*case this.CMP_NOTEQUAL:
                 var alphaTestFunc = 1;
                 var invertedAlphaTest = 1;
                 var alphaTestRef = this._alphaTestState.states[this.RS_ALPHAREF];
                 break;*/

                case this.CMP_GREATEREQUAL:
                    alphaTestFunc = 0;
                    invertedAlphaTest = 1;
                    alphaTestRef = -this._alphaTestState.states[this.RS_ALPHAREF];
                    break;

                default:
                    alphaTestFunc = 0;
                    invertedAlphaTest = 0;
                    alphaTestRef = 1;
                    break;
            }

            const clipPlaneEnable = 0;
            gl.uniform4f(
                this.shadowHandles.shadowStateInt,
                invertedAlphaTest,
                alphaTestRef,
                alphaTestFunc,
                clipPlaneEnable);
            //this._shadowStateBuffers
        }
    }

    /**
     * Sets a render mode
     * @param {number} renderMode
     */
    SetStandardStates(renderMode)
    {
        if (this._currentRenderMode === renderMode) return;

        this.gl.frontFace(this.gl.CW);
        switch (renderMode)
        {
            case this.RM_OPAQUE:
            case this.RM_PICKABLE:
            case this.RM_DISTORTION:
                this.SetRenderState(this.RS_ZENABLE, true);
                this.SetRenderState(this.RS_ZWRITEENABLE, true);
                this.SetRenderState(this.RS_ZFUNC, this.CMP_LEQUAL);
                this.SetRenderState(this.RS_CULLMODE, this.CULL_CW);
                this.SetRenderState(this.RS_ALPHABLENDENABLE, false);
                this.SetRenderState(this.RS_ALPHATESTENABLE, false);
                this.SetRenderState(this.RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(this.RS_SLOPESCALEDEPTHBIAS, 0);
                this.SetRenderState(this.RS_DEPTHBIAS, 0);
                this.SetRenderState(this.RS_COLORWRITEENABLE, 0xf);
                break;

            case this.RM_DECAL:
                this.SetRenderState(this.RS_ALPHABLENDENABLE, false);
                this.SetRenderState(this.RS_ALPHATESTENABLE, true);
                this.SetRenderState(this.RS_ALPHAFUNC, this.CMP_GREATER);
                this.SetRenderState(this.RS_ALPHAREF, 127);
                this.SetRenderState(this.RS_ZENABLE, true);
                this.SetRenderState(this.RS_ZWRITEENABLE, true);
                this.SetRenderState(this.RS_ZFUNC, this.CMP_LEQUAL);
                this.SetRenderState(this.RS_CULLMODE, this.CULL_CW);
                this.SetRenderState(this.RS_BLENDOP, this.BLENDOP_ADD);
                this.SetRenderState(this.RS_SLOPESCALEDEPTHBIAS, 0);
                this.SetRenderState(this.RS_DEPTHBIAS, 0);
                this.SetRenderState(this.RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(this.RS_COLORWRITEENABLE, 0xf);
                break;

            case this.RM_TRANSPARENT:
                this.SetRenderState(this.RS_CULLMODE, this.CULL_CW);
                this.SetRenderState(this.RS_ALPHABLENDENABLE, true);
                this.SetRenderState(this.RS_SRCBLEND, this.BLEND_SRCALPHA);
                this.SetRenderState(this.RS_DESTBLEND, this.BLEND_INVSRCALPHA);
                this.SetRenderState(this.RS_BLENDOP, this.BLENDOP_ADD);
                this.SetRenderState(this.RS_ZENABLE, true);
                this.SetRenderState(this.RS_ZWRITEENABLE, false);
                this.SetRenderState(this.RS_ZFUNC, this.CMP_LEQUAL);
                this.SetRenderState(this.RS_ALPHATESTENABLE, false);
                this.SetRenderState(this.RS_SLOPESCALEDEPTHBIAS, 0); // -1.0
                this.SetRenderState(this.RS_DEPTHBIAS, 0);
                this.SetRenderState(this.RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(this.RS_COLORWRITEENABLE, 0xf);
                break;

            case this.RM_ADDITIVE:
                this.SetRenderState(this.RS_CULLMODE, this.CULL_NONE);
                this.SetRenderState(this.RS_ALPHABLENDENABLE, true);
                this.SetRenderState(this.RS_SRCBLEND, this.BLEND_ONE);
                this.SetRenderState(this.RS_DESTBLEND, this.BLEND_ONE);
                this.SetRenderState(this.RS_BLENDOP, this.BLENDOP_ADD);
                this.SetRenderState(this.RS_ZENABLE, true);
                this.SetRenderState(this.RS_ZWRITEENABLE, false);
                this.SetRenderState(this.RS_ZFUNC, this.CMP_LEQUAL);
                this.SetRenderState(this.RS_ALPHATESTENABLE, false);
                this.SetRenderState(this.RS_SLOPESCALEDEPTHBIAS, 0);
                this.SetRenderState(this.RS_DEPTHBIAS, 0);
                this.SetRenderState(this.RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(this.RS_COLORWRITEENABLE, 0xf);
                break;

            case this.RM_FULLSCREEN:
                this.SetRenderState(this.RS_ALPHABLENDENABLE, false);
                this.SetRenderState(this.RS_ALPHATESTENABLE, false);
                this.SetRenderState(this.RS_CULLMODE, this.CULL_NONE);
                this.SetRenderState(this.RS_ZENABLE, false);
                this.SetRenderState(this.RS_ZWRITEENABLE, false);
                this.SetRenderState(this.RS_ZFUNC, this.CMP_ALWAYS);
                this.SetRenderState(this.RS_SLOPESCALEDEPTHBIAS, 0);
                this.SetRenderState(this.RS_DEPTHBIAS, 0);
                this.SetRenderState(this.RS_SEPARATEALPHABLENDENABLE, false);
                this.SetRenderState(this.RS_COLORWRITEENABLE, 0xf);
                break;

            default:
                return;
        }

        this._currentRenderMode = renderMode;
    }

    /**
     * Creates a gl context
     *
     * @param {HTMLCanvasElement} canvas
     * @param {*} [params]
     * @param {*} [contextNames]
     * @returns {*}
     */
    static CreateContext(canvas, params, contextNames)
    {
        contextNames = Array.isArray(contextNames) ? contextNames : [contextNames];
        for (let i = 0; i < contextNames.length; i++)
        {
            try
            {
                return canvas.getContext(contextNames[i], params);
            }
            catch (err)
            {
                /* eslint-disable-line no-empty */
            }
        }
        return null;
    }

    /**
     * The constructor used to generate the time
     * @type {DateConstructor}
     */
    static Clock = Date;

    /**
     * Requests and animation frame
     */
    static RequestAnimationFrame = (function ()
    {
        const requestFrame = window['requestAnimationFrame'] ||
            window['webkitRequestAnimationFrame'] ||
            window['mozRequestAnimationFrame'] ||
            window['oRequestAnimationFrame'] ||
            window['msRequestAnimationFrame'] ||
            function (callback)
            {
                if (!timeOuts) timeOuts = [];
                timeOuts.push(window.setTimeout(callback, 1000 / 60));
                return timeOuts.length - 1;
            };

        /**
         * Requests an animation frame
         * @param {Function} callback
         * @returns {number} id
         */
        return function (callback)
        {
            return requestFrame(callback);
        };
    })();

    /**
     * Cancels an animation frame by it's id
     */
    static CancelAnimationFrame = (function ()
    {
        const cancelFrame =
            window['cancelAnimationFrame'] ||
            window['webkitRequestAnimationFrame'] ||
            window['mozRequestAnimationFrame'] ||
            window['oRequestAnimationFrame'] ||
            window['msRequestAnimationFrame'] ||
            function (id)
            {
                if (!timeOuts) timeOuts = [];
                if (timeOuts[id] !== undefined)
                {
                    window.clearTimeout(timeOuts[id]);
                    timeOuts[id] = undefined;
                    return true;
                }
            };

        /**
         * Cancels an animation frame by it's id
         * @param {number} id
         */
        return function (id)
        {
            cancelFrame(id);
        };
    })();

    /**
     * Webgl vendor prefixes
     * @type {string[]}
     */
    static WebglVendorPrefixes = ['', 'MOZ_', 'WEBKIT_', 'WEBGL_'];

    /**
     * Webgl context names
     * @type {string[]}
     */
    static WebglContextNames = ['webgl', 'experimental-webgl'];

    /**
     * Webgl2 context names
     * @type {string[]}
     */
    static Webgl2ContextNames = ['webgl2', 'experimental-webgl2'];

    /**
     * Webgl version
     * @type {{NONE: number, WEBGL: number, WEBGL2: number}}
     */
    static WebglVersion = {
        NONE: 0,
        WEBGL: 1,
        WEBGL2: 2
    };

    /**
     * Class category
     * @type {string}
     */
    static category = 'device';

}

// Storage for devices without request animation frame
let timeOuts;

// Render Modes
Tw2Device.prototype.RM_ANY = -1;
Tw2Device.prototype.RM_OPAQUE = 0;
Tw2Device.prototype.RM_DECAL = 1;
Tw2Device.prototype.RM_TRANSPARENT = 2;
Tw2Device.prototype.RM_ADDITIVE = 3;
Tw2Device.prototype.RM_DEPTH = 4;
Tw2Device.prototype.RM_FULLSCREEN = 5;
Tw2Device.prototype.RM_PICKABLE = 6;
Tw2Device.prototype.RM_DISTORTION = 7;

// Render States
Tw2Device.prototype.RS_ZENABLE = 7; // D3DZBUFFERTYPE (or TRUE/FALSE for legacy)
Tw2Device.prototype.RS_FILLMODE = 8; // D3DFILLMODE
Tw2Device.prototype.RS_SHADEMODE = 9; // D3DSHADEMODE
Tw2Device.prototype.RS_ZWRITEENABLE = 14; // TRUE to enable z writes
Tw2Device.prototype.RS_ALPHATESTENABLE = 15; // TRUE to enable alpha tests
Tw2Device.prototype.RS_LASTPIXEL = 16; // TRUE for last-pixel on lines
Tw2Device.prototype.RS_SRCBLEND = 19; // D3DBLEND
Tw2Device.prototype.RS_DESTBLEND = 20; // D3DBLEND
Tw2Device.prototype.RS_CULLMODE = 22; // D3DCULL
Tw2Device.prototype.RS_ZFUNC = 23; // D3DCMPFUNC
Tw2Device.prototype.RS_ALPHAREF = 24; // D3DFIXED
Tw2Device.prototype.RS_ALPHAFUNC = 25; // D3DCMPFUNC
Tw2Device.prototype.RS_DITHERENABLE = 26; // TRUE to enable dithering
Tw2Device.prototype.RS_ALPHABLENDENABLE = 27; // TRUE to enable alpha blending
Tw2Device.prototype.RS_FOGENABLE = 28; // TRUE to enable fog blending
Tw2Device.prototype.RS_SPECULARENABLE = 29; // TRUE to enable specular
Tw2Device.prototype.RS_FOGCOLOR = 34; // D3DCOLOR
Tw2Device.prototype.RS_FOGTABLEMODE = 35; // D3DFOGMODE
Tw2Device.prototype.RS_FOGSTART = 36; // Fog start (for both vertex and pixel fog)
Tw2Device.prototype.RS_FOGEND = 37; // Fog end
Tw2Device.prototype.RS_FOGDENSITY = 38; // Fog density
Tw2Device.prototype.RS_RANGEFOGENABLE = 48; // Enables range-based fog
Tw2Device.prototype.RS_STENCILENABLE = 52; // BOOL enable/disable stenciling
Tw2Device.prototype.RS_STENCILFAIL = 53; // D3DSTENCILOP to do if stencil test fails
Tw2Device.prototype.RS_STENCILZFAIL = 54; // D3DSTENCILOP to do if stencil test passes and Z test fails
Tw2Device.prototype.RS_STENCILPASS = 55; // D3DSTENCILOP to do if both stencil and Z tests pass
Tw2Device.prototype.RS_STENCILFUNC = 56; // D3DCMPFUNC fn.  Stencil Test passes if ((ref & mask) stencilfn (stencil & mask)) is true
Tw2Device.prototype.RS_STENCILREF = 57; // Reference value used in stencil test
Tw2Device.prototype.RS_STENCILMASK = 58; // Mask value used in stencil test
Tw2Device.prototype.RS_STENCILWRITEMASK = 59; // Write mask applied to values written to stencil buffer
Tw2Device.prototype.RS_TEXTUREFACTOR = 60; // D3DCOLOR used for multi-texture blend
Tw2Device.prototype.RS_WRAP0 = 128; // wrap for 1st texture coord. set
Tw2Device.prototype.RS_WRAP1 = 129; // wrap for 2nd texture coord. set
Tw2Device.prototype.RS_WRAP2 = 130; // wrap for 3rd texture coord. set
Tw2Device.prototype.RS_WRAP3 = 131; // wrap for 4th texture coord. set
Tw2Device.prototype.RS_WRAP4 = 132; // wrap for 5th texture coord. set
Tw2Device.prototype.RS_WRAP5 = 133; // wrap for 6th texture coord. set
Tw2Device.prototype.RS_WRAP6 = 134; // wrap for 7th texture coord. set
Tw2Device.prototype.RS_WRAP7 = 135; // wrap for 8th texture coord. set
Tw2Device.prototype.RS_CLIPPING = 136;
Tw2Device.prototype.RS_LIGHTING = 137;
Tw2Device.prototype.RS_AMBIENT = 139;
Tw2Device.prototype.RS_FOGVERTEXMODE = 140;
Tw2Device.prototype.RS_COLORVERTEX = 141;
Tw2Device.prototype.RS_LOCALVIEWER = 142;
Tw2Device.prototype.RS_NORMALIZENORMALS = 143;
Tw2Device.prototype.RS_DIFFUSEMATERIALSOURCE = 145;
Tw2Device.prototype.RS_SPECULARMATERIALSOURCE = 146;
Tw2Device.prototype.RS_AMBIENTMATERIALSOURCE = 147;
Tw2Device.prototype.RS_EMISSIVEMATERIALSOURCE = 148;
Tw2Device.prototype.RS_VERTEXBLEND = 151;
Tw2Device.prototype.RS_CLIPPLANEENABLE = 152;
Tw2Device.prototype.RS_POINTSIZE = 154; // float point size
Tw2Device.prototype.RS_POINTSIZE_MIN = 155; // float point size min threshold
Tw2Device.prototype.RS_POINTSPRITEENABLE = 156; // BOOL point texture coord control
Tw2Device.prototype.RS_POINTSCALEENABLE = 157; // BOOL point size scale enable
Tw2Device.prototype.RS_POINTSCALE_A = 158; // float point attenuation A value
Tw2Device.prototype.RS_POINTSCALE_B = 159; // float point attenuation B value
Tw2Device.prototype.RS_POINTSCALE_C = 160; // float point attenuation C value
Tw2Device.prototype.RS_MULTISAMPLEANTIALIAS = 161; // BOOL - set to do FSAA with multisample buffer
Tw2Device.prototype.RS_MULTISAMPLEMASK = 162; // DWORD - per-sample enable/disable
Tw2Device.prototype.RS_PATCHEDGESTYLE = 163; // Sets whether patch edges will use float style tessellation
Tw2Device.prototype.RS_DEBUGMONITORTOKEN = 165; // DEBUG ONLY - token to debug monitor
Tw2Device.prototype.RS_POINTSIZE_MAX = 166;// float point size max threshold
Tw2Device.prototype.RS_INDEXEDVERTEXBLENDENABLE = 167;
Tw2Device.prototype.RS_COLORWRITEENABLE = 168; // per-channel write enable
Tw2Device.prototype.RS_TWEENFACTOR = 170; // float tween factor
Tw2Device.prototype.RS_BLENDOP = 171; // D3DBLENDOP setting
Tw2Device.prototype.RS_POSITIONDEGREE = 172; // NPatch position interpolation degree. D3DDEGREE_LINEAR or D3DDEGREE_CUBIC (default)
Tw2Device.prototype.RS_NORMALDEGREE = 173; // NPatch normal interpolation degree. D3DDEGREE_LINEAR (default) or D3DDEGREE_QUADRATIC
Tw2Device.prototype.RS_SCISSORTESTENABLE = 174;
Tw2Device.prototype.RS_SLOPESCALEDEPTHBIAS = 175;
Tw2Device.prototype.RS_ANTIALIASEDLINEENABLE = 176;
Tw2Device.prototype.RS_TWOSIDEDSTENCILMODE = 185; // BOOL enable/disable 2 sided stenciling
Tw2Device.prototype.RS_CCW_STENCILFAIL = 186; // D3DSTENCILOP to do if ccw stencil test fails
Tw2Device.prototype.RS_CCW_STENCILZFAIL = 187; // D3DSTENCILOP to do if ccw stencil test passes and Z test fails
Tw2Device.prototype.RS_CCW_STENCILPASS = 188; // D3DSTENCILOP to do if both ccw stencil and Z tests pass
Tw2Device.prototype.RS_CCW_STENCILFUNC = 189; // D3DCMPFUNC fn.  ccw Stencil Test passes if ((ref & mask) stencilfn (stencil & mask)) is true
Tw2Device.prototype.RS_COLORWRITEENABLE1 = 190; // Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS
Tw2Device.prototype.RS_COLORWRITEENABLE2 = 191; // Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS
Tw2Device.prototype.RS_COLORWRITEENABLE3 = 192; // Additional ColorWriteEnables for the devices that support D3DPMISCCAPS_INDEPENDENTWRITEMASKS
Tw2Device.prototype.RS_BLENDFACTOR = 193; // D3DCOLOR used for a constant blend factor during alpha blending for devices that support D3DPBLENDCAPS_BLENDFACTOR
Tw2Device.prototype.RS_SRGBWRITEENABLE = 194; // Enable rendertarget writes to be DE-linearized to SRGB (for formats that expose D3DUSAGE_QUERY_SRGBWRITE)
Tw2Device.prototype.RS_DEPTHBIAS = 195;
Tw2Device.prototype.RS_SEPARATEALPHABLENDENABLE = 206; // TRUE to enable a separate blending function for the alpha channel
Tw2Device.prototype.RS_SRCBLENDALPHA = 207; // SRC blend factor for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE
Tw2Device.prototype.RS_DESTBLENDALPHA = 208; // DST blend factor for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE
Tw2Device.prototype.RS_BLENDOPALPHA = 209; // Blending operation for the alpha channel when RS_SEPARATEDESTALPHAENABLE is TRUE */// Cull Modes
Tw2Device.prototype.CULL_NONE = 1;
Tw2Device.prototype.CULL_CW = 2;
Tw2Device.prototype.CULL_CCW = 3;
// Compare
Tw2Device.prototype.CMP_NEVER = 1;
Tw2Device.prototype.CMP_LESS = 2;
Tw2Device.prototype.CMP_EQUAL = 3;
Tw2Device.prototype.CMP_LEQUAL = 4;
Tw2Device.prototype.CMP_GREATER = 5;
Tw2Device.prototype.CMP_NOTEQUAL = 6;
Tw2Device.prototype.CMP_GREATEREQUAL = 7;
Tw2Device.prototype.CMP_ALWAYS = 8;
// Blend
Tw2Device.prototype.BLEND_ZERO = 1;
Tw2Device.prototype.BLEND_ONE = 2;
Tw2Device.prototype.BLEND_SRCCOLOR = 3;
Tw2Device.prototype.BLEND_INVSRCCOLOR = 4;
Tw2Device.prototype.BLEND_SRCALPHA = 5;
Tw2Device.prototype.BLEND_INVSRCALPHA = 6;
Tw2Device.prototype.BLEND_DESTALPHA = 7;
Tw2Device.prototype.BLEND_INVDESTALPHA = 8;
Tw2Device.prototype.BLEND_DESTCOLOR = 9;
Tw2Device.prototype.BLEND_INVDESTCOLOR = 10;
Tw2Device.prototype.BLEND_SRCALPHASAT = 11;
Tw2Device.prototype.BLEND_BOTHSRCALPHA = 12;
Tw2Device.prototype.BLEND_BOTHINVSRCALPHA = 13;
Tw2Device.prototype.BLEND_BLENDFACTOR = 14;
Tw2Device.prototype.BLEND_INVBLENDFACTOR = 15;
// Blend Operations
Tw2Device.prototype.BLENDOP_ADD = 1;
Tw2Device.prototype.BLENDOP_SUBTRACT = 2;
Tw2Device.prototype.BLENDOP_REVSUBTRACT = 3;
Tw2Device.prototype.BLENDOP_MIN = 4;
Tw2Device.prototype.BLENDOP_MAX = 5;

export const device = new Tw2Device();
