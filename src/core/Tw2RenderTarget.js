import {util, device} from '../global';
import {Tw2TextureRes} from './resource/Tw2TextureRes';

/**
 * Tw2RenderTarget
 *
 * @property {string|number} _id               - the render target's id
 * @property {string} name                     - the render target's name
 * @property {Tw2TextureRes} texture           - the render target's texture
 * @property {?number} width                   - width of the render target's texture
 * @property {?number} height                  - height of the render target's texture
 * @property {?boolean} hasDepth               - toggles depth
 * @property {WebGLFramebuffer} _frameBuffer   - the render target's webgl frame buffer
 * @property {WebGLRenderbuffer} _renderBuffer - the render target's webgl render buffer
 * @class
 */
export class Tw2RenderTarget
{

    _id = util.generateID();
    name = '';
    texture = null;
    width = null;
    height = null;
    hasDepth = null;
    _frameBuffer = null;
    _renderBuffer = null;


    /**
     * Destroys the render target's webgl buffers and textures
     */
    Destroy()
    {
        const gl = device.gl;

        if (this.texture)
        {
            gl.deleteTexture(this.texture.texture);
            this.texture = null;
        }

        if (this._renderBuffer)
        {
            gl.deleteRenderbuffer(this._renderBuffer);
            this._renderBuffer = null;
        }

        if (this._frameBuffer)
        {
            gl.deleteFramebuffer(this._frameBuffer);
            this._frameBuffer = null;
        }
    }

    /**
     * Creates the render target's texture
     *
     * @param {number} width     - The resulting texture's width
     * @param {number} height    - The resulting texture's height
     * @param {boolean} hasDepth - Optional flag to enable a depth buffer
     */
    Create(width, height, hasDepth)
    {
        const gl = device.gl;

        this.Destroy();
        this.texture = new Tw2TextureRes();
        this.texture.Attach(gl.createTexture());

        this._frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);

        gl.bindTexture(gl.TEXTURE_2D, this.texture.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, null);

        this._renderBuffer = null;

        if (hasDepth)
        {
            this._renderBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, this._renderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        }

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.texture, 0);

        if (hasDepth)
        {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._renderBuffer);
        }

        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.texture.width = this.width = width;
        this.texture.height = this.height = height;
        this.hasDepth = hasDepth;
    }

    /**
     * Sets the render target as the current frame buffer
     */
    Set()
    {
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, this._frameBuffer);
        device.gl.viewport(0, 0, this.width, this.height);
    }

    /**
     * Unsets the render target as the current frame buffer
     */
    Unset()
    {
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, null);
        device.gl.viewport(0, 0, device.viewportWidth, device.viewportHeight);
    }

}
