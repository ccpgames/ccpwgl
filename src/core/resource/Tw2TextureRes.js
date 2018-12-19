import {Tw2Resource} from './Tw2Resource';
import {
    ErrResourceFormat,
    ErrHTTPRequest,
    ErrFeatureNotImplemented,
    ErrResourceExtensionUnregistered
} from '../Tw2Error';
import {
    resMan,
    device,
    DDS_HEADER_LENGTH_INT,
    DDS_HEADER_OFFSET_CAPS2,
    DDS_HEADER_OFFSET_FLAGS,
    DDS_HEADER_OFFSET_HEIGHT,
    DDS_HEADER_OFFSET_MAGIC,
    DDS_HEADER_OFFSET_MIPMAP_COUNT,
    DDS_HEADER_OFFSET_PF_FOURCC,
    DDS_HEADER_OFFSET_SIZE,
    DDS_HEADER_OFFSET_WIDTH,
    DDS_MAGIC,
    DDSCAPS2_CUBEMAP,
    DDSD_MIPMAPCOUNT,
    FOURCC_DXT1,
    FOURCC_DXT3,
    FOURCC_DXT5
} from '../../global';

/**
 * Tw2TextureRes
 *
 * @property {WebGLTexture} texture
 * @property {boolean} isCube
 * @property {number} width
 * @property {number} height
 * @property {boolean} hasMipMaps
 * @property {boolean} enableMipMaps
 * @property {?string} requestResponseType
 * @property {number} _currentSampler
 * @property {boolean} _isAttached    - identifies if the texture was attached rather than loaded
 * @property {?string} _extension     - loading file extension
 * @inherit Tw2Resource
 */
export class Tw2TextureRes extends Tw2Resource
{

    texture = null;
    isCube = false;
    width = 0;
    height = 0;
    hasMipMaps = false;
    requestResponseType = null;
    _currentSampler = 0;
    _isAttached = false;
    _extension = null;

    /**
     * Prepares the resource
     * @param {*|Image|arrayBuffer} data
     */
    Prepare(data)
    {
        const gl = device.gl;
        const format = 'ccpGLFormat' in data ? data['ccpGLFormat'] : gl.RGBA;

        switch (this._extension)
        {
            case 'cube':
                this.texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = data.height;
                const ctx = canvas.getContext('2d');
                for (let j = 0; j < 6; ++j)
                {
                    ctx.drawImage(data, j * canvas.width, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
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
                gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, data);
                this.hasMipMaps = Tw2TextureRes.IsPowerOfTwo(data.width) && Tw2TextureRes.IsPowerOfTwo(data.height);
                if (this.hasMipMaps) gl.generateMipmap(gl.TEXTURE_2D);
                gl.bindTexture(gl.TEXTURE_2D, null);
                this.width = data.width;
                this.height = data.height;
                break;

            /*

            DDS methods based off work by Brandon Jones and Babylon
            -----------------------------------------------------------------------
            Copyright (c) 2012 Brandon Jones

            This software is provided 'as-is', without any express or implied
            warranty. In no event will the authors be held liable for any damages
            arising from the use of this software.

            Permission is granted to anyone to use this software for any purpose,
            including commercial applications, and to alter it and redistribute it
            freely, subject to the following restrictions:

            1. The origin of this software must not be misrepresented; you must not
            claim that you wrote the original software. If you use this software
            in a product, an acknowledgment in the product documentation would be
            appreciated but is not required.

            2. Altered source versions must be plainly marked as such, and must not
            be misrepresented as being the original software.

            3. This notice may not be removed or altered from any source
            distribution.

            */
            case 'dds':
                const
                    ext = device.ext.CompressedTextureS3TC,
                    header = new Int32Array(data, 0, DDS_HEADER_LENGTH_INT),
                    isFourCC = header[DDS_HEADER_OFFSET_PF_FOURCC],
                    isMagic = header[DDS_HEADER_OFFSET_MAGIC] === DDS_MAGIC,
                    isCube = (header[DDS_HEADER_OFFSET_CAPS2] & DDSCAPS2_CUBEMAP) === DDSCAPS2_CUBEMAP,
                    fourCC = header[DDS_HEADER_OFFSET_PF_FOURCC],
                    mipmaps = (header[DDS_HEADER_OFFSET_FLAGS] & DDSD_MIPMAPCOUNT) ?
                        Math.max(1, header[DDS_HEADER_OFFSET_MIPMAP_COUNT]) : 1;

                // Check compatibility
                if (!ext) throw new ErrResourceFormat('Compressed textures not supported by your device');
                if (!isMagic) throw new ErrResourceFormat('Invalid DDS, missing magic number');
                if (!isFourCC) throw new ErrResourceFormat('Invalid DDS, missing FourCC code');

                let
                    width = header[DDS_HEADER_OFFSET_WIDTH],
                    height = header[DDS_HEADER_OFFSET_HEIGHT],
                    dataOffset = header[DDS_HEADER_OFFSET_SIZE] + 4,
                    blockBytes,
                    internalFormat;

                switch (fourCC)
                {
                    case FOURCC_DXT1:
                        blockBytes = 8;
                        internalFormat = ext.COMPRESSED_RGBA_S3TC_DXT1_EXT;
                        break;

                    case FOURCC_DXT3:
                        blockBytes = 16;
                        internalFormat = ext.COMPRESSED_RGBA_S3TC_DXT3_EXT;
                        break;

                    case FOURCC_DXT5:
                        blockBytes = 16;
                        internalFormat = ext.COMPRESSED_RGBA_S3TC_DXT5_EXT;
                        break;

                    default:
                        const code = Tw2TextureRes.Int32ToFourCC(fourCC);
                        throw new ErrResourceFormat(`Invalid DDS, ${code} unsupported`);
                }

                this.hasMipMaps = mipmaps > 1;
                this.isCube = isCube;
                this.width = width;
                this.height = height;

                if (this.isCube)
                {
                    // TODO: Add dds cube map support
                    throw new ErrFeatureNotImplemented({feature: 'DDS cube maps'});
                }
                else
                {
                    this.texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, this.texture);
                    for (let i = 0; i < mipmaps; ++i)
                    {
                        const dataLength = Math.max(4, width) / 4 * Math.max(4, height) / 4 * blockBytes;
                        const byteArray = new Uint8Array(data, dataOffset, dataLength);
                        gl.compressedTexImage2D(gl.TEXTURE_2D, i, internalFormat, width, height, 0, byteArray);
                        dataOffset += dataLength;
                        width *= 0.5;
                        height *= 0.5;
                    }
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }
                break;

            default:
                throw new ErrResourceFormat(`Invalid format, ${this._extension} unsupported`);
        }

        this._extension = null;
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
        this._extension = extension;
        switch (this._extension)
        {
            case 'cube':
                this.isCube = true;
                path = path.substr(0, path.length - 5) + '.png';
                break;

            case 'png':
                this.isCube = false;
                break;

            case 'dds':
                // Pass back to the ResMan to load
                this._extension = extension;
                this.requestResponseType = 'arraybuffer';
                return false;

            default:
                this._extension = null;
                throw new ErrResourceExtensionUnregistered({path, extension});
        }

        this.OnRequested();
        resMan._pendingLoads++;

        const image = new Image();
        image.crossOrigin = 'anonymous';

        /**
         * Fires on errors
         */
        image.onerror = () =>
        {
            resMan._pendingLoads--;
            this._extension = null;
            this.OnError(new ErrHTTPRequest({path}));
        };

        /**
         * Fires when loaded
         */
        image.onload = () =>
        {
            resMan._pendingLoads--;
            resMan._prepareQueue.push([this, image, null]);
            this.OnLoaded();
        };

        image.src = Tw2TextureRes.AddMipLevelSkipCount(path);
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
        this._extension = null;
        this.requestResponseType = null;
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
        this._extension = null;
        this.requestResponseType = null;
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
        if (sampler.hash !== this._currentSampler || this._updateSampler)
        {
            sampler.Apply(this.hasMipMaps);
            this._currentSampler = sampler.hash;
            this._updateSampler = false;
        }
    }

    /**
     * Finds out if a number is to the power of 2
     * @param {number} a
     * @returns {boolean}
     */
    static IsPowerOfTwo(a)
    {
        return (a & (a - 1)) === 0;
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

    /**
     * Converts an int32 into FourCC format
     * @param {number} value
     * @returns {string}
     */
    static Int32ToFourCC(value)
    {
        return String.fromCharCode(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);
    }

}