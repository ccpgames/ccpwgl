import {mat4} from '../../global';
import {Tw2VectorParameter} from './Tw2Parameter';

/**
 * Tw2MatrixParameter
 *
 * @class
 */
export class Tw2MatrixParameter extends Tw2VectorParameter
{

    /**
     * Constructor
     * @param {string} [name='']
     * @param {mat4|Float32Array|Array} [value=mat4.create()]
     */
    constructor(name = '', value = mat4.create())
    {
        super(name, value);
    }

    /**
     * Composes the parameter's value from components
     * @param {Tw2Vector4Parameter|quat} rotation
     * @param {Tw2Vector3Parameter|vec3} translation
     * @param {Tw2Vector3Parameter|vec3} scaling
     */
    Compose(rotation, translation, scaling)
    {
        if ('value' in rotation) rotation = rotation['value'];
        if ('value' in translation) translation = translation['value'];
        if ('value' in scaling) scaling = scaling['value'];

        mat4.fromRotationTranslationScale(this.value, rotation, translation, scaling);
        this.OnValueChanged();
    }

    /**
     * Decomposes the parameter's value to components
     * @param {Tw2Vector4Parameter|quat} rotation
     * @param {Tw2Vector3Parameter|vec3} translation
     * @param {Tw2Vector3Parameter|vec3} scaling
     */
    Decompose(rotation, translation, scaling)
    {
        mat4.getRotation('value' in rotation ? rotation.value : rotation, this.value);
        mat4.getTranslation('value' in translation ? translation.value : translation, this.value);
        mat4.getScaling('value' in scaling ? scaling.value : scaling, this.value);

        if ('OnValueChanged' in rotation) rotation.OnValueChanged();
        if ('OnValueChanged' in translation) translation.OnValueChanged();
        if ('OnValueChanged' in scaling) scaling.OnValueChanged();
    }

    /**
     * Gets the matrices' translation x value
     * @returns {number}
     */
    get x()
    {
        return this.GetIndexValue(12);
    }

    /**
     * Sets the matrices' translation x value
     * @param {number} val
     */
    set x(val)
    {
        this.SetIndexValue(12, val);
    }

    /**
     * Gets the matrices' translation y value
     * @returns {number}
     */
    get y()
    {
        return this.GetIndexValue(13);
    }

    /**
     * Sets the matrices' translation y value
     * @param {number} val
     */
    set y(val)
    {
        this.SetIndexValue(13, val);
    }

    /**
     * Gets the matrices' translation z value
     * @returns {number}
     */
    get z()
    {
        return this.GetIndexValue(14);
    }

    /**
     * Sets the matrices' translation z value
     * @param {number} val
     */
    set z(val)
    {
        this.SetIndexValue(14, val);
    }

    /**
     * The parameter's constant buffer size
     * @type {number}
     */
    static constantBufferSize = 16;

}