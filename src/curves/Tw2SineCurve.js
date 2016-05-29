/**
 * Tw2SineCurve
 * @property {string} name
 * @property {Number} value
 * @property {Number} offset
 * @property {Number} scale
 * @property {Number} speed
 * @constructor
 */
function Tw2SineCurve()
{
    this.name = '';
    this.value = 0;
    this.offset = 0;
    this.scale = 1;
    this.speed = 1;
}

/**
 * Updates a value at a specific time
 * @param {Number} time
 */
Tw2SineCurve.prototype.UpdateValue = function(time)
{
    this.value = this.GetValueAt(time);
};

/**
 * Gets a value at a specific time
 * @param {Number} time
 * @returns {Number}
 */
Tw2SineCurve.prototype.GetValueAt = function(time)
{
    return Math.sin(time * Math.pi * 2 * this.speed) * this.scale + this.offset;
};
