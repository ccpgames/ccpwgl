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
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.texture = null;
        this.width = null;
        this.height = null;
        this.hasDepth = null;
        this._frameBuffer = null;
        this._renderBuffer = null;
    }

    /**
     * Destroys the render target's webgl buffers and textures
     */
    Destroy()
    {
        if (this.texture)
        {
            device.gl.deleteTexture(this.texture.texture);
            this.texture = null;
        }

        if (this._renderBuffer)
        {
            device.gl.deleteRenderbuffer(this._renderBuffer);
            this._renderBuffer = null;
        }

        if (this._frameBuffer)
        {
            device.gl.deleteFramebuffer(this._frameBuffer);
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
        this.Destroy();
        this.texture = new Tw2TextureRes();
        this.texture.Attach(device.gl.createTexture());

        this._frameBuffer = device.gl.createFramebuffer();
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, this._frameBuffer);

        device.gl.bindTexture(device.gl.TEXTURE_2D, this.texture.texture);
        device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, width, height, 0, device.gl.RGBA, device.gl.UNSIGNED_BYTE, null);
        device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, device.gl.LINEAR);
        device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, device.gl.LINEAR);
        device.gl.bindTexture(device.gl.TEXTURE_2D, null);

        this._renderBuffer = null;

        if (hasDepth)
        {
            this._renderBuffer = device.gl.createRenderbuffer();
            device.gl.bindRenderbuffer(device.gl.RENDERBUFFER, this._renderBuffer);
            device.gl.renderbufferStorage(device.gl.RENDERBUFFER, device.gl.DEPTH_COMPONENT16, width, height);
        }

        device.gl.framebufferTexture2D(device.gl.FRAMEBUFFER, device.gl.COLOR_ATTACHMENT0, device.gl.TEXTURE_2D, this.texture.texture, 0);

        if (hasDepth)
        {
            device.gl.framebufferRenderbuffer(device.gl.FRAMEBUFFER, device.gl.DEPTH_ATTACHMENT, device.gl.RENDERBUFFER, this._renderBuffer);
        }

        device.gl.bindRenderbuffer(device.gl.RENDERBUFFER, null);
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, null);

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
