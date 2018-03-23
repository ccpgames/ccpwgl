import {curve, vec3, quat, mat4, util} from '../../math';
import {resMan} from '../../core';

/**
 * Tw2TransformTrack
 *
 * @property {string|number} _id
 * @property {string} name
 * @property {string} resPath
 * @property {Object} res
 * @property {string} group
 * @property {boolean} cycle
 * @property {number} duration
 * @property {vec3} translation
 * @property {quat} rotation
 * @property {vec3} scale
 * @property positionCurve
 * @property orientationCurve
 * @property scaleCurve
 * @property {mat4} _scaleShear
 * @class
 */
export class Tw2TransformTrack
{
    constructor()
    {
        this._id = util.generateID();
        this.name = '';
        this.resPath = '';
        this.res = null;
        this.group = '';
        this.cycle = false;
        this.duration = 0;
        this.translation = vec3.create();
        this.rotation = quat.create();
        this.scale = vec3.fromValues(0, 0, 0);
        this.scaleShear = mat4.create();
        this.positionCurve = null;
        this.orientationCurve = null;
        this.scaleCurve = null;
    }

    /**
     * Initializes the Curve
     */
    Initialize()
    {
        if (this.resPath !== '')
        {
            this.res = resMan.GetResource(this.resPath);
        }
    }

    /**
     * Gets curve length
     *
     * @returns {number}
     */
    GetLength()
    {
        return this.duration;
    }

    /**
     * Updates a value at a specific time
     *
     * @param {number} time
     */
    UpdateValue(time)
    {
        if (!this.res || !this.res.IsGood()) return;
        if (!this.positionCurve) this.FindTracks();
        if (!this.positionCurve) return;
        if (this.cycle) time = time % this.duration;
        if (time > this.duration || time < 0) return;

        curve.evaluate(this.positionCurve, time, this.translation, this.cycle, this.duration);
        curve.evaluate(this.orientationCurve, time, this.rotation, this.cycle, this.duration);
        quat.normalize(this.rotation, this.rotation);
        curve.evaluate(this.scaleCurve, time, this.scaleShear, this.cycle, this.duration);
        mat4.getScaling(this.scale, this.scaleCurve);
    }

    /**
     * FindTracks
     */
    FindTracks()
    {
        let group = null;
        for (let i = 0; i < this.res.animations.length; ++i)
        {
            for (let j = 0; j < this.res.animations[i].trackGroups.length; ++j)
            {
                if (this.res.animations[i].trackGroups[j].name === this.group)
                {
                    this.duration = this.res.animations[i].duration;
                    group = this.res.animations[i].trackGroups[j];
                    break;
                }
            }
        }

        if (!group) return;

        for (let i = 0; i < group.transformTracks.length; ++i)
        {
            if (this.name === group.transformTracks[i].name)
            {
                this.positionCurve = group.transformTracks[i].position;
                this.orientationCurve = group.transformTracks[i].orientation;
                this.scaleCurve = group.transformTracks[i].scaleShear;
                break;
            }
        }
    }
}