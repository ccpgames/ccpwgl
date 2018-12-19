import {isFunction, template} from '../global/util';

const HAS_CAPTURE_STACK_TRACE = isFunction(Error['captureStackTrace']);

/**
 * Tw2Error
 *
 * @property {string} name    - The error's name
 * @property {string} message - The error's message
 * @property {Object} data    - Optional error data
 * @class
 */
export class Tw2Error extends Error
{
    /**
     * Constructor
     * @param {string|Object} [data={}]                   - Error message or an object containing relevant data
     * @param {string} [defaultMessage='Undefined Error'] - The default error message
     */
    constructor(data = {}, defaultMessage = 'Undefined error')
    {
        let message = defaultMessage;
        if (typeof data === 'string')
        {
            message = data;
            data = {};
        }
        else if (data.message)
        {
            message = data.message;
            delete data.message;
        }

        super();
        this.message = template(message, data);
        this.name = this.constructor.name;
        this.data = data;

        if (HAS_CAPTURE_STACK_TRACE)
        {
            Error['captureStackTrace'](this, Tw2Error);
        }
        else
        {
            this.stack = (new Error(this.message)).stack;
        }
    }

    /**
     * Emits an event on a target emitter
     * @param {*} emitter
     * @param {String} [eventName='error']
     * @param {*} [e={}]
     * @returns {Tw2Error}
     */
    emitOn(emitter, eventName = 'error', e = {})
    {
        if (emitter && emitter.emit)
        {
            emitter.emit(eventName, Object.assign({
                err: this,
                log: {
                    type: 'error',
                    message: this.message,
                    err: this
                }
            }, this.data, e));
        }
        return this;
    }

    /**
     * Class category
     * @type {string}
     */
    static category = 'error';

}


/**
 * Throws on http request errors
 */
export class ErrHTTPRequest extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Communication error while requesting resource');
    }
}


/**
 * Throws on http request send errors
 */
export class ErrHTTPRequestSend extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Communication send error while requesting resource');
    }
}


/**
 * Throws when an xml http instance cannot be created
 */
export class ErrHTTPInstance extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Could not create an XML HTTP instance');
    }
}


/**
 * Throws on http status errors
 */
export class ErrHTTPStatus extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Communication status error while loading resource (%status%)');
    }
}


/**
 * Throws on http ready state errors
 */
export class ErrHTTPReadyState extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Communication ready state error while loading resource');
    }
}


/**
 * Throws when xml is not a valid format
 */
export class ErrXMLBinaryFormat extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Invalid binary format');
    }
}


/**
 * Throws when an xml object type is undefined
 */
export class ErrXMLObjectTypeUndefined extends Tw2Error
{
    constructor(data)
    {
        super(data, 'XML Object type "%type%" undefined type');
    }
}


/**
 * Throws when a geometry mesh lacks an element required for a particle system
 */
export class ErrGeometryMeshMissingParticleElement extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Input geometry mesh lacks element required by particle system');
    }
}


/**
 * Throws when a geometry mesh element doesn't have the required number of components
 */
export class ErrGeometryMeshElementComponentsMissing extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Input geometry mesh elements do not have the required number of components');
    }
}


/**
 * Throws when a geometry mesh has an invalid bone name for a model
 */
export class ErrGeometryMeshBoneNameInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Geometry mesh has invalid bone name for model');
    }
}


/**
 * Throws when there is an error binding a geometry mesh to an effect
 */
export class ErrGeometryMeshEffectBinding extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Error binding geometry mesh to effect');
    }
}


/**
 * Throws when a geometry mesh has an invalid file type
 */
export class ErrGeometryFileType extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Invalid geometry file type (%fileType%)');
    }
}


/**
 * Throws when a resource path has an unregistered prefix
 */
export class ErrResourcePrefixUnregistered extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Unregistered resource prefix (%prefix%)');
    }
}


/**
 * Throws when a resource path has no prefix
 */
export class ErrResourcePrefixUndefined extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Undefined resource prefix');
    }
}


/**
 * Throws when a resource path has an unregistered file extension
 */
export class ErrResourceExtensionUnregistered extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Unregistered resource extension (%extension%)');
    }
}


/**
 * Throws when a resource path has no file extension
 */
export class ErrResourceExtensionUndefined extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Undefined resource extension');
    }
}


/**
 * Throws in invalid resource formats
 */
export class ErrResourceFormat extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Invalid resource format');
    }
}


/**
 * Throws when an effect has an invalid shader version
 */
export class ErrShaderVersion extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Invalid version of effect file (%version%)');
    }
}


/**
 * Throws when an effect has no header
 */
export class ErrShaderHeaderSize extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Effect file contains no compiled effects');
    }
}


/**
 * Throws when a shader has an invalid permutation value
 */
export class ErrShaderPermutationValue extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Invalid shader permutation value');
    }
}


/**
 * Throws when a shader cannot compile
 */
export class ErrShaderCompile extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Error compiling %shaderType% shader (%infoLog%)');
    }
}


/**
 * Throws when unable to link a vertex shader and fragment shader
 */
export class ErrShaderLink extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Error linking shaders');
    }
}


/**
 * Throws on invalid raw data declaration types
 */
export class ErrDeclarationValueType extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Invalid declaration value type (%declaration%:%valueType%)');
    }
}


/**
 * Throws when a class can only be instantiated once
 */
export class ErrSingletonInstantiation extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Multiple class instantiations not yet supported');
    }
}


/**
 * Throws when an abstract classes' method is not implemented directly on a child class
 */
export class ErrAbstractClassMethod extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Abstract class method not implemented directly on child class');
    }
}

/**
 * Throws when a feature is not implemented
 */
export class ErrFeatureNotImplemented extends Tw2Error
{
    constructor(data)
    {
        super(data, '%feature=Feature% not implemented');
    }
}

/**
 * Throws when an index is out of bounds
 */
export class ErrIndexBounds extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Array index out of bounds');
    }
}