/**
 * Tw2Animation
 *
 * @property {Tw2GeometryAnimation} animationRes
 * @property {number} time
 * @property {number} timeScale
 * @property {boolean} cycle
 * @property {boolean} isPlaying
 * @property {Function} callback - Stores optional callback passed to prototypes
 * @property {Array} trackGroups - Array of {@link Tw2TrackGroup}
 * @class
 */
export class Tw2Animation
{

    animationRes = null;
    time = 0;
    timeScale = 1.0;
    cycle = false;
    isPlaying = false;
    callback = null;
    trackGroups = [];


    /**
     * Checks to see if the animation has finished playing
     * @return {boolean}
     */
    IsFinished()
    {
        return !this.cycle && this.time >= this.animationRes.duration;
    }

}