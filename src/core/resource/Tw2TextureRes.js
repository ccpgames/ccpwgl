import {resMan, device} from '../../global';
import {Tw2Resource} from './Tw2Resource';
import {HTTPRequestError, Tw2ResourceExtensionUnregisteredError} from '../Tw2Error';

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

    texture = null;
    isCube = false;
    images = [];
    width = 0;
    height = 0;
    hasMipMaps = false;
    _facesLoaded = 0;
    _currentSampler = 0;
    _isAttached = false;


    /**
     * Prepares the resource
     * @param {string} extension
     */
    Prepare(extension)
    {
        const
            gl = device.gl,
            format = this.images[0]['ccpGLFormat'] ? this.images[0]['ccpGLFormat'] : gl.RGBA;

        switch (extension)
        {
            case 'cube':
                this.texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = this.images[0].height;
                const ctx = canvas.getContext('2d');
                for (let j = 0; j < 6; ++j)
                {
                    ctx.drawImage(this.images[0], j * canvas.width, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, 0, format, format, gl.UNSIGNED_BYTE, canvas);
                }
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                this.width = canvas.width;
                this.height = canvas.height;
                this.hasMipMaps = true;
                break;

            case 'png':
                this.texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, this.images[0]);
                this.hasMipMaps = Tw2TextureRes.IsPowerOfTwo(this.images[0].width) && Tw2TextureRes.IsPowerOfTwo(this.images[0].height);
                if (this.hasMipMaps) gl.generateMipmap(gl.TEXTURE_2D);
                gl.bindTexture(gl.TEXTURE_2D, null);
                this.width = this.images[0].width;
                this.height = this.images[0].height;
                break;

            default:
                throw new Tw2ResourceExtensionUnregisteredError({path: this.path, extension});
        }

        this.images = null;
        this._isAttached = false;
        this.OnPrepared();
    }

    /**
     * An optional method resources can have that allows them to take over loading their resources
     * @param {string} path - texture resource path
     * @param {string} extension - the texture extension
     * @returns {boolean} returns true to tell the resMan not to handle http requests
     */
    DoCustomLoad(path, extension)
    {
        switch (extension)
        {
            case 'cube':
                this.isCube = true;
                path = path.substr(0, path.length - 5) + '.png';
                break;

            case 'png':
                this.isCube = false;
                break;

            default:
                throw new Tw2ResourceExtensionUnregisteredError({path, extension});
        }

        this.OnRequested();
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
            this.images = null;
            this.OnError(new HTTPRequestError({path}));
        };

        /**
         * Fires when loaded
         */
        this.images[0].onload = () =>
        {
            resMan._pendingLoads--;
            resMan._prepareQueue.push([this, extension, null]);
            this.OnLoaded();
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
     * Attaches a texture
     * @param {WebGLTexture} texture
     */
    Attach(texture)
    {
        this.path = '';
        this.texture = texture;
        this._isPurged = false;
        this._isAttached = true;
        this.OnLoaded({hide: true, data: {isAttachment: true}});
        this.OnPrepared({hide: true, data: {isAttachment: true}});
    }

    /**
     * Reloads the texture
     */
    Reload()
    {
        if (!this._isAttached)
        {
            return super.Reload();
        }
    }

    /**
     * Bind
     * @param sampler
     * @param slices
     */
    Bind(sampler, slices)
    {
        const
            d = device,
            gl = d.gl;

        this.KeepAlive();
        let targetType = sampler.samplerType;
        if (targetType !== (this.isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D)) return;

        if (!this.texture)
        {
            const texture = targetType === gl.TEXTURE_2D ? d.GetFallbackTexture() : d.GetFallbackCubeMap();
            gl.bindTexture(targetType, texture);
            return;
        }

        if (sampler.isVolume)
        {
            gl.uniform1f(slices, this.height / this.width);
        }

        gl.bindTexture(targetType, this.texture);
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