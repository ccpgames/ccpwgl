import {resMan} from '../global/Tw2ResMan';
import {device} from '../global/Tw2Device';
import {logger} from '../global/Tw2Logger';
import {Tw2Resource} from './Tw2Resource';

/**
 * Tw2TextureRes
 *
 * @property {WebGLTexture} texture
 * @property {boolean} isCube
 * @property {Array} images
 * @property {number} width
 * @property {number} height
 * @property {number} _facesLoaded
 * @property {boolean} hasMipMaps
 * @property {number} _currentSampler
 * @property {boolean} isAttached - identifies if the texture was attached rather than loaded
 * @inherit Tw2Resource
 */
export class Tw2TextureRes extends Tw2Resource
{
    constructor()
    {
        super();
        this.texture = null;
        this.isCube = false;
        this.images = [];
        this.width = 0;
        this.height = 0;
        this.hasMipMaps = false;
        this._facesLoaded = 0;
        this._currentSampler = 0;
        this._isAttached = false;
    }

    /**
     * Prepares the resource
     * @param {string} text
     */
    Prepare(text)
    {
        const
            d = device,
            format = this.images[0]['ccpGLFormat'] ? this.images[0]['ccpGLFormat'] : d.gl.RGBA;

        switch (text)
        {
            case 'cube':
                this.texture = d.gl.createTexture();
                d.gl.bindTexture(d.gl.TEXTURE_CUBE_MAP, this.texture);
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = this.images[0].height;
                const ctx = canvas.getContext('2d');
                for (let j = 0; j < 6; ++j)
                {
                    ctx.drawImage(this.images[0], j * canvas.width, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
                    d.gl.texImage2D(d.gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, 0, format, format, d.gl.UNSIGNED_BYTE, canvas);
                }
                d.gl.generateMipmap(d.gl.TEXTURE_CUBE_MAP);
                d.gl.bindTexture(d.gl.TEXTURE_CUBE_MAP, null);
                this.width = canvas.width;
                this.height = canvas.height;
                this.hasMipMaps = true;
                this._isAttached = false;
                this.PrepareFinished(true);
                break;

            //case 'png':
            default:
                this.texture = d.gl.createTexture();
                d.gl.bindTexture(d.gl.TEXTURE_2D, this.texture);
                d.gl.texImage2D(d.gl.TEXTURE_2D, 0, format, format, d.gl.UNSIGNED_BYTE, this.images[0]);
                this.hasMipMaps = Tw2TextureRes.IsPowerOfTwo(this.images[0].width) && Tw2TextureRes.IsPowerOfTwo(this.images[0].height);
                if (this.hasMipMaps) d.gl.generateMipmap(d.gl.TEXTURE_2D);
                d.gl.bindTexture(d.gl.TEXTURE_2D, null);
                this.width = this.images[0].width;
                this.height = this.images[0].height;
                this._isAttached = false;
                this.PrepareFinished(true);
                break;
        }

        this.images = null;
    }

    /**
     * An optional method resources can have that allows them to take over loading their resources
     * @param {string} path - texture resource path
     * @returns {boolean} returns true to tell the resMan not to handle http requests
     */
    DoCustomLoad(path)
    {
        const ext = resMan.constructor.GetPathExt(path);
        switch (ext)
        {
            case 'cube':
                this.isCube = true;
                path = path.substr(0, path.length - 5) + '.png';
                break;

            //case 'png':
            default:
                this.isCube = false;
                break;
        }

        this.LoadStarted();
        resMan._pendingLoads++;

        this.images = [];
        this.images[0] = new Image();
        this.images[0].crossOrigin = 'anonymous';

        /**
         * Fires on errors
         */
        this.images[0].onerror = () =>
        {
            resMan._pendingLoads--;
            logger.log('res.error', {
                log: 'error',
                src: ['Tw2TextureRes', 'DoCustomLoad'],
                msg: 'Error loading resource',
                type: 'http.error',
                path: path
            });
            this.LoadFinished(false);
            this.PrepareFinished(false);
            this.images = null;
        };

        /**
         * Fires when loaded
         */
        this.images[0].onload = () =>
        {
            resMan._pendingLoads--;
            resMan._prepareQueue.push([this, ext, null]);
            this.LoadFinished(true);
        };

        this.images[0].src = Tw2TextureRes.AddMipLevelSkipCount(path);
        return true;
    }

    /**
     * Unloads the texture from memory
     * @returns {boolean}
     */
    Unload()
    {
        if (this.texture)
        {
            device.gl.deleteTexture(this.texture);
            this.texture = null;
        }
        this._isPurged = true;
        this._isGood = false;
        this._isAttached = false;
        return true;
    }

    /**
     * Attach
     * @param {WebGLTexture} texture
     */
    Attach(texture)
    {
        this.texture = texture;
        this._isAttached = true;
        this.LoadFinished(true);
        this.PrepareFinished(true);
    }

    /**
     * Bind
     * @param sampler
     * @param slices
     */
    Bind(sampler, slices)
    {
        const d = device;

        this.KeepAlive();
        let targetType = sampler.samplerType;
        if (targetType !== (this.isCube ? d.gl.TEXTURE_CUBE_MAP : d.gl.TEXTURE_2D)) return;

        if (!this.texture)
        {
            const texture = targetType === d.gl.TEXTURE_2D ? d.GetFallbackTexture() : d.GetFallbackCubeMap();
            d.gl.bindTexture(targetType, texture);
            return;
        }

        if (sampler.isVolume)
        {
            d.gl.uniform1f(slices, this.height / this.width);
        }

        d.gl.bindTexture(targetType, this.texture);
        if (sampler.hash !== this._currentSampler)
        {
            sampler.Apply(this.hasMipMaps);
            this._currentSampler = sampler.hash;
        }
    }

    /**
     * Finds out if a number is to the power of 2
     * @param {number} x
     * @returns {boolean}
     */
    static IsPowerOfTwo(x)
    {
        return (x & (x - 1)) === 0;
    }

    /**
     * Adds mip levels to a path
     * @param {string} path
     * @returns {string}}
     */
    static AddMipLevelSkipCount(path)
    {
        const
            d = device,
            mipExt = d.mipLevelSkipCount > 0 ? '.' + d.mipLevelSkipCount.toString() : '';

        if (d.mipLevelSkipCount > 0)
        {
            const index = path.lastIndexOf('.');
            if (index >= 0)
            {
                path = path.substr(0, index - 2) + mipExt + path.substr(index);
            }
        }
        return path;
    }
}