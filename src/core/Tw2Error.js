import {isFunction, template} from '../global/util';

const HAS_CAPTURE_STACK_TRACE = isFunction(Error['captureStackTrace']);

/**
 * Extends standard errors
 * @param {string|{}} data          - Error message or an object containing relevant data
 * @param {string} [defaultMessage] - The default error message
 */
export class Tw2Error extends Error
{
    constructor(data = {}, defaultMessage = 'Undefined error')
    {
        super();

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

        this.message = template(message, data);
        this.name = this.constructor.name;
        this.data = data;
        this.data.err = this;

        if (HAS_CAPTURE_STACK_TRACE)
        {
            Error['captureStackTrace'](this, Tw2Error);
        }
        else
        {
            this.stack = (new Error(this.message)).stack;
        }
    }
}

/**
 * Fallback if instanceof Error isn't supported by client
 * @type {boolean}
 */
Tw2Error.isError = true;


/**
 * Throws on http request errors
 */
export class HTTPRequestError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Communication error while requesting resource');
    }
}


/**
 * Throws on http request send errors
 */
export class HTTPRequestSendError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Communication send error while requesting resource');
    }
}


/**
 * Throws when an xml http instance cannot be created
 */
export class HTTPInstanceError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Could not create an XML HTTP instance');
    }
}


/**
 * Throws on http status errors
 */
export class HTTPStatusError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Communication status error while loading resource (%status%)');
    }
}


/**
 * Throws on http ready state errors
 */
export class HTTPReadyStateError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Communication ready state error while loading resource');
    }
}


/**
 * Throws when xml is not a valid format
 */
export class Tw2XMLBinaryError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Invalid binary');
    }
}


/**
 * Throws when an xml object type is undefined
 */
export class Tw2XMLObjectTypeUndefinedError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'XML Object with undefined type (%type%)');
    }
}


/**
 * Throws when a geometry mesh lacks an element required for a particle system
 */
export class Tw2GeometryMeshParticleElementError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Input geometry mesh lacks element required by particle system');
    }
}


/**
 * Throws when a geometry mesh element doesn't have the required number of components
 */
export class Tw2GeometryMeshElementComponentError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Input geometry mesh elements do not have the required number of components');
    }
}


/**
 * Throws when a geometry mesh has an invalid bone name for a model
 */
export class Tw2GeometryMeshInvalidBoneError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Geometry mesh has invalid bone name for model');
    }
}


/**
 * Throws when there is an error binding a geometry mesh to an effect
 */
export class Tw2GeometryMeshEffectBindError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Error binding geometry mesh to effect');
    }
}


/**
 * Throws when a geometry mesh has an invalid file type
 */
export class Tw2GeometryFileTypeError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Invalid geometry file type (%fileType%)');
    }
}


/**
 * Throws when a resource path has an unregistered prefix
 */
export class Tw2ResourcePrefixUnregisteredError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Unregistered resource prefix (%prefix%)');
    }
}


/**
 * Throws when a resource path has no prefix
 */
export class Tw2ResourcePrefixUndefinedError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Undefined resource prefix');
    }
}


/**
 * Throws when a resource path has an unregistered file extension
 */
export class Tw2ResourceExtensionUnregisteredError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Unregistered resource extension (%extension%)');
    }
}


/**
 * Throws when a resource path has no file extension
 */
export class Tw2ResourceExtensionUndefinedError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Undefined resource extension');
    }
}


/**
 * Throws when an effect has an invalid shader version
 */
export class Tw2ShaderVersionError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Invalid version of effect file (%version%)');
    }
}


/**
 * Throws when an effect has no header
 */
export class Tw2ShaderHeaderSizeError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Effect file contains no compiled effects');
    }
}


/**
 * Throws when a shader has an invalid permutation value
 */
export class Tw2ShaderPermutationValueError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Invalid shader permutation value');
    }
}


/**
 * Throws when a shader cannot compile
 */
export class Tw2ShaderCompileError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Error compiling %shaderType% shader');
    }
}


/**
 * Throws when unable to link a vertex shader and fragment shader
 */
export class Tw2ShaderLinkError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Error linking shaders');
    }
}


/**
 * Throws on invalid raw data declaration types
 */
export class Tw2DeclarationValueTypeError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Invalid declaration value type (%declaration%:%valueType%)');
    }
}


/**
 * Throws when a class can only be instantiated once
 */
export class Tw2SingleInstantiationError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Multiple class instantiations not yet supported');
    }
}


/**
 * Throws when an abstract classes' method is not implemented directly on a child class
 */
export class Tw2AbstractClassMethodError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Abstract class method not implemented directly on child class');
    }
}

/**
 * Throws when a feature is not implemented
 */
export class Tw2FeatureNotImplementedError extends Tw2Error
{
    constructor(data)
    {
        super(data, 'Feature not implemented');
    }
}
