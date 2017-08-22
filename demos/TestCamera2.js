/**
 * Test Camera
 * @param {HTMLCanvasElement|Element} element
 * @constructor
 */
function TestCamera(element)
{
	this.distance = 1;
	this.minDistance = -1;
	this.maxDistance = 1000000;
	this.fov = 60;
	this.rotationX = 0;
	this.rotationY = 0;
	this.poi = vec3.create();
	this.nearPlane = 1;
	this.farPlane = 0;

	this.onShift = null;
	this.shift = 0;
	this.shiftStage = 0;
	this._shiftX = null;
	
	this._dragX = 0;
	this._dragY = 0;
	this._lastRotationX = 0;
	this._lastRotationY = 0;
	this._rotationSpeedX = 0;
	this._rotationSpeedY = 0;
	this._measureRotation = null;
	this._moveEvent = null;
	this._upEvent = null;
	this._prevScale = null;
	
	this.additionalRotationX = 0;
	this.additionalRotationY = 0;

    var self = this;
    element.addEventListener('mousedown', function (event) { self._DragStart(event); }, false);
    element.addEventListener('touchstart', function (event) { self._DragStart(event); }, true);
    window.addEventListener('DOMMouseScroll', function (e) { return self._WheelHandler(e, element); }, false);
    window.addEventListener('mousewheel', function (e) { return self._WheelHandler(e, element); }, false);
}

/**
 * Creates a test camera for demonstrations
 * 
 * @param {HTMLCanvasElement|Element} canvas
 * @param {*} [options]
 * @returns {TestCamera}
 */
TestCamera.Create = function(canvas, options)
{
    function get(src, srcAttr, defaultValue)
    {
        return src && srcAttr in src ? src[srcAttr] : defaultValue;
    }

    var camera = new TestCamera(canvas);
    camera.fov = get(options, 'fov', 30);
    camera.distance = get(options, 'distance', 1000);
    camera.maxDistance = get(options, 'maxDistance', 1000000);
    camera.minDistance = get(options, 'minDistance', 0.6);
    camera.rotationX = get(options, 'rotationX', 0);
    camera.rotationY = get(options, 'rotationY', 0);
    vec3.copy(camera.poi, get(options, 'poi', [0,0,0]));
    camera.nearPlane = get(options, 'nearPlane', 0.1);
    camera.farPlane = get(options, 'farPlane', 1000000);
    camera.minPitch = get(options, 'minPitch', -0.5);
    camera.maxPitch = get(options, 'maxPitch', 0.35);
    return camera;
};

/**
 * Sets the cameras poi to an object, and adjusts the distance to suit
 *
 * @param {SpaceObject|Ship|Planet} obj
 * @param {number} [distanceMultiplier]
 * @param {number} [minDistance]
 * @returns {boolean}
 */
TestCamera.prototype.focus = function(obj, distanceMultiplier, minDistance)
{
    try
    {
        mat4.getTranslation(this.poi, obj.getTransform());
        this.distance = Math.max(obj.getBoundingSphere()[1] * (distanceMultiplier || 1), (minDistance || 0));
        console.log(this.distance);
        return true;
    }
    catch(err)
    {
        return false;
    }
};

TestCamera.prototype.getView = function ()
{
    var view = mat4.create();
    mat4.identity(view);
    mat4.rotateY(view, view, -this.shift);
    mat4.translate(view, view, [0, 0.0, -this.distance]);
    mat4.rotateX(view, view, this.rotationY + this.additionalRotationY);
    mat4.rotateY(view, view, this.rotationX + this.additionalRotationX);
    mat4.translate(view, view, [-this.poi[0], -this.poi[1], -this.poi[2]]);
    return view;
};

TestCamera.prototype.getProjection = function (aspect)
{
    var fH = Math.tan(this.fov / 360 * Math.PI) * this.nearPlane;
    var fW = fH * aspect;
    return mat4.frustum(mat4.create(), -fW, fW, -fH, fH, this.nearPlane,  this.farPlane > 0 ? this.farPlane : this.distance * 2);
};

TestCamera.prototype.update = function (dt)
{
    this.rotationX += this._rotationSpeedX * dt;
    this._rotationSpeedX *= 0.9;
    this.rotationY += this._rotationSpeedY * dt;
    this._rotationSpeedY *= 0.9;
    if (this.rotationY < -Math.PI / 2)
    {
        this.rotationY = -Math.PI / 2;
    }
    if (this.rotationY > Math.PI / 2)
    {
        this.rotationY = Math.PI / 2;
    }
    if (this.shiftStage === 2)
    {
        this.shift += this.shift * dt * 5;
        if (Math.abs(this.shift) > 2)
        {
            this.onShift(1, this.shift > 0);
            //this.shift = -this.shift;
            //this._shiftOut = false;
        }
    }
    else if (this.shiftStage === 1)
    {
        this.shift -= this.shift * Math.min(dt, 0.5) * 2;
    }
}

TestCamera.prototype._DragStart = function (event)
{
    if (!event.touches && !this.onShift && event.button !== 0)
    {
        return;
    }
    if (this._moveEvent || this._upEvent)
    {
        return;
    }

    var self = this;
    if (this._moveEvent === null)
    {
        document.addEventListener("mousemove", this._moveEvent = function (event) { self._DragMove(event); }, true);
        document.addEventListener("touchmove", this._moveEvent, true);
    }
    if (this._upEvent === null)
    {
        document.addEventListener("mouseup", this._upEvent = function (event) { self._DragStop(event); }, true);
        document.addEventListener("touchend", this._upEvent, true);
    }
    event.preventDefault();
    if (event.touches)
    {
        event.screenX = event.touches[0].screenX;
        event.screenY = event.touches[0].screenY;
    }
    this._dragX = event.screenX;
    this._dragY = event.screenY;
    this._shiftX = null;
    this._rotationSpeedX = 0;
    this._lastRotationX = this.rotationX;
    this._rotationSpeedY = 0;
    this._lastRotationY = this.rotationY;
    this._measureRotation = setTimeout(function () { self._MeasureRotation(); }, 500);
};

TestCamera.prototype._MeasureRotation = function ()
{
    var self = this;
    this._lastRotationX = this.rotationX;
    this._lastRotationY = this.rotationY;
	this._measureRotation = setTimeout(function() { self._MeasureRotation(); }, 500);
};

TestCamera.prototype._DragMove = function (event)
{
    if (this.onShift && (event.touches && event.touches.length > 2 || !event.touches && event.button != 0))
    {
        this.shiftStage = 0;
        event.preventDefault();
        if (event.touches)
        {
            event.screenX = 0;
            event.screenY = 0;
            for (var i = 0; i < event.touches.length; ++i)
            {
                event.screenX += event.touches[i].screenX;
                event.screenY += event.touches[i].screenY;
            }
            event.screenX /= event.touches.length;
            event.screenY /= event.touches.length;
        }
        if (this._shiftX !== null)
        {
            this.shift += (event.screenX - this._shiftX) / device.viewportWidth * 2;
        }
        this._shiftX = event.screenX;
        return;
    }
    this._shiftX = null;
    if (event.touches)
    {
        if (event.touches.length > 1)
        {
            event.preventDefault();
            var dx = event.touches[0].screenX - event.touches[1].screenX;
            var dy = event.touches[0].screenY - event.touches[1].screenY;
            var scale = Math.sqrt(dx * dx + dy * dy);
            if (this._prevScale != null)
            {
                var delta = (this._prevScale - scale) * 0.03;
                this.distance = this.distance + delta * this.distance * 0.1;
                if (this.distance < this.minDistance)
                {
                    this.distance = this.minDistance;
                }
                if (this.distance > this.maxDistance)
                {
                    this.distance = this.maxDistance;
                }
            }
            this._prevScale = scale;
            return;
        }
        event.screenX = event.touches[0].screenX;
        event.screenY = event.touches[0].screenY;
    }
    if (typeof (event.screenX) !== 'undefined')
    {
        var dRotation = -(this._dragX - event.screenX) * 0.01;
        this.rotationX += dRotation;
        this._dragX = event.screenX;
        dRotation = -(this._dragY - event.screenY) * 0.01;
        this.rotationY += dRotation;
        this._dragY = event.screenY;
        if (this.rotationY < -Math.PI / 2)
        {
            this.rotationY = -Math.PI / 2;
        }
        if (this.rotationY > Math.PI / 2)
        {
            this.rotationY = Math.PI / 2;
        }
    }
}

TestCamera.prototype._DragStop = function (event)
{
    clearTimeout(this._measureRotation);
    document.removeEventListener("mousemove", this._moveEvent, true);
    document.removeEventListener("mouseup", this._upEvent, true);
    document.removeEventListener("touchmove", this._moveEvent, true);
    document.removeEventListener("touchend", this._upEvent, true);
    this._moveEvent = null;
    this._upEvent = null;
    var dRotation = this.rotationX - this._lastRotationX;
    this._rotationSpeedX = dRotation * 0.5;
    dRotation = this.rotationY - this._lastRotationY;
    this._rotationSpeedY = dRotation * 0.5;
    this._prevScale = null;
    if (this.onShift)
    {
        if (Math.abs(this.shift) > 0.5)
        {
            this.shiftStage = 2;
            this.onShift(0, this.shift > 0);
        }
        else
        {
            this.shiftStage = 1;
        }
    }
}


TestCamera.prototype._WheelHandler = function (event, element)
{
    var delta = 0;
    if (!event) /* For IE. */
        event = window.event;
    var source = null;
    if (event.srcElement)
    {
        source = event.srcElement;
    }
    else
    {
        source = event.target;
    }
    if (source !== element)
    {
        return false;
    }
    if (event.wheelDelta)
    { /* IE/Opera. */
        delta = event.wheelDelta / 120;
        /** In Opera 9, delta differs in sign as compared to IE.
        */
        if (window.opera)
            delta = -delta;
    } else if (event.detail)
    { /** Mozilla case. */
        /** In Mozilla, sign of delta is different than in IE.
        * Also, delta is multiple of 3.
        */
        delta = -event.detail / 3;
    }
    /** If delta is nonzero, handle it.
    * Basically, delta is now positive if wheel was scrolled up,
    * and negative, if wheel was scrolled down.
    */
    if (delta)
    {
        this.distance = this.distance + delta * this.distance * 0.1;
        if (this.distance < this.minDistance)
        {
            this.distance = this.minDistance;
        }
    }
    /** Prevent default actions caused by mouse wheel.
    * That might be ugly, but we handle scrolls somehow
    * anyway, so don't bother here..
    */
    if (event.preventDefault)
        event.preventDefault();
    event.returnValue = false;
    return false;
};
