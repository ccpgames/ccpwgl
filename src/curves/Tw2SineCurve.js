/**
 * Tw2SineCurve
 * @property {string} name
 * @property {number} value
 * @property {number} offset
 * @property {number} scale
 * @property {number} speed
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
 * @param {number} time
 */
Tw2SineCurve.prototype.UpdateValue = function(time)
{
    this.value = this.GetValueAt(time);
};

/**
 * Gets a value at a specific time
 * @param {number} time
 * @returns {number}
 */
Tw2SineCurve.prototype.GetValueAt = function(time)
{
    return Math.sin(time * Math.PI * 2 * this.speed) * this.scale + this.offset;
};
