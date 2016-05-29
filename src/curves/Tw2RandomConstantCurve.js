/**
 * Tw2RandomConstantCurve
 * @property {string} name
 * @property {Number} value
 * @property {Number} min
 * @property {Number} max
 * @property {Boolean} hold
 * @constructor
 */
function Tw2RandomConstantCurve()
{
    this.name = '';
    this.value = 0;
    this.min = 0;
    this.max = 1;
    this.hold = true;
}

/**
 * Updates a value at a specific time
 * @param {Number} time
 */
Tw2RandomConstantCurve.prototype.UpdateValue = function(time)
{
    this.value = this.GetValueAt(time);
};

/**
 * Gets a value at a specific time
 * @param {Number} time
 * @returns {Number}
 */
Tw2RandomConstantCurve.prototype.GetValueAt = function(time)
{
    if (!this.hold)
    {
        this.value = this.min + (this.max - this.min) * Math.random();
    }
    return this.value;
};
