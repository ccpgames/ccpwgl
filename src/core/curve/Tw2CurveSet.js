/**
 * Tw2CurveSet
 *
 * @property {string} name
 * @property {Array.<Tw2Curve|Tw2CurveSequencer>} curves
 * @property {Array} bindings
 * @property {number} scale
 * @property {boolean} playOnLoad
 * @property {boolean} isPlaying
 * @property {number} scaledTime
 */
export class Tw2CurveSet
{
    constructor()
    {
        this.name = '';
        this.curves = [];
        this.bindings = [];
        this.scale = 1;
        this.playOnLoad = true;
        this.isPlaying = false;
        this.scaledTime = 0;
    }

    /**
     * Initializes the Tw2CurveSet
     */
    Initialize()
    {
        if (this.playOnLoad) this.Play();
    }

    /**
     * Plays the Tw2CurveSet
     */
    Play()
    {
        this.isPlaying = true;
        this.scaledTime = 0;
    }

    /**
     * Plays the Tw2CurveSet from a specific time
     * @param {number} [time=0]
     */
    PlayFrom(time = 0)
    {
        this.isPlaying = true;
        this.scaledTime = time;
    }

    /**
     * Stops the Tw2CurveSet from playing
     */
    Stop()
    {
        this.isPlaying = false;
    }

    /**
     * Internal render/update function which is called every frame
     * @param {number} dt - Delta Time
     */
    Update(dt)
    {
        if (this.isPlaying)
        {
            this.scaledTime += dt * this.scale;

            for (let i = 0; i < this.curves.length; ++i)
            {
                this.curves[i].UpdateValue(this.scaledTime);
            }

            for (let i = 0; i < this.bindings.length; ++i)
            {
                this.bindings[i].CopyValue();
            }
        }
    }

    /**
     * Gets the maximum curve duration
     *
     * @returns {number}
     */
    GetMaxCurveDuration()
    {
        let length = 0;
        for (let i = 0; i < this.curves.length; ++i)
        {
            if ('GetLength' in this.curves[i])
            {
                length = Math.max(length, this.curves[i].GetLength());
            }
        }
        return length;
    }
}
