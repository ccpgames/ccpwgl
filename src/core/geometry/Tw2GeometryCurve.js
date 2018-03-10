/**
 * Tw2GeometryCurve
 *
 * @property {number} dimension
 * @property {number} degree
 * @property {Float32Array} knots
 * @property {Float32Array} controls
 */
export class Tw2GeometryCurve
{
    constructor()
    {
        this.dimension = 0;
        this.degree = 0;
        this.knots = null;
        this.controls = null;
    }
}