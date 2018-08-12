import { isFunction, isString } from '../global/util/index';

const HAS_CAPTURE_STACK_TRACE = isFunction(Error['captureStackTrace']);

/**
 * Extends standard errors
 * @param {string|{}} data          - Error message or an object containing relevant data
 * @param {string} [defaultMessage] - The default error message
 */
export class Tw2Error extends Error
{
    constructor(data={}, defaultMessage='Undefined error')
    {
        super();

        if (isString(data))
        {
            data = { message: data };
        }
        else
        {
            data.message = data.message || defaultMessage;
        }

        this.message = data.message;
        this.name = this.constructor.name;
        this.data = data;

        if (HAS_CAPTURE_STACK_TRACE)
        {
            Error['captureStackTrace'](this, Tw2Error);
        }
        else
        {
            this.stack = (new Error(data.message)).stack;
        }
    }
}

/**
 * Fallback if instanceof Error isn't supported by client
 * @type {boolean}
 */
Tw2Error.isError = true;