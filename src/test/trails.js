Trails = function ()
{
    var device = ccpwgl_int.device;
    var gl = device.gl;

    if (!gl.getExtension('OES_texture_float') || gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 1)
    {
        console.log("'OES_texture_float' not supported");
        this.Clear = function () {};
        this.AddTrail = function (prevTrailPoint, nextTrailPoint, color, maxSize) {};
        this.Update = function (dt) {};
        return;
    }

    console.info("'OES_texture_float' supported");

    var rtSize = 512;

    var rt0 = new ccpwgl_int.Tw2RenderTarget();
    rt0.Create(rtSize, rtSize, false);
    device.gl.bindTexture(device.gl.TEXTURE_2D, rt0.texture.texture);
    device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, rtSize, rtSize, 0, device.gl.RGBA, device.gl.FLOAT, null);
    device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, device.gl.NEAREST);
    device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, device.gl.NEAREST);
    device.gl.bindTexture(device.gl.TEXTURE_2D, null);

    var rt1 = new ccpwgl_int.Tw2RenderTarget();
    rt1.Create(rtSize, rtSize, false);
    device.gl.bindTexture(device.gl.TEXTURE_2D, rt1.texture.texture);
    device.gl.texImage2D(device.gl.TEXTURE_2D, 0, device.gl.RGBA, rtSize, rtSize, 0, device.gl.RGBA, device.gl.FLOAT, null);
    device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MAG_FILTER, device.gl.NEAREST);
    device.gl.texParameteri(device.gl.TEXTURE_2D, device.gl.TEXTURE_MIN_FILTER, device.gl.NEAREST);
    device.gl.bindTexture(device.gl.TEXTURE_2D, null);

    var vbSize = 1024;
    var vbStride = 9;
    var vb = gl.createBuffer();

    gl.bindBuffer(device.gl.ARRAY_BUFFER, vb);
    gl.bufferData(device.gl.ARRAY_BUFFER, 4 * vbStride * vbSize * 6, gl.DYNAMIC_DRAW);
    gl.bindBuffer(device.gl.ARRAY_BUFFER, null);

    var declaration = new ccpwgl_int.Tw2VertexDeclaration();
    declaration.elements.push(new ccpwgl_int.Tw2VertexElement(ccpwgl_int.Tw2VertexDeclaration.DECL_POSITION, 0, gl.FLOAT, 2, 0));
    declaration.elements.push(new ccpwgl_int.Tw2VertexElement(ccpwgl_int.Tw2VertexDeclaration.DECL_TEXCOORD, 0, gl.FLOAT, 3, 8));
    declaration.elements.push(new ccpwgl_int.Tw2VertexElement(ccpwgl_int.Tw2VertexDeclaration.DECL_TEXCOORD, 1, gl.FLOAT, 3, 20));
    declaration.elements.push(new ccpwgl_int.Tw2VertexElement(ccpwgl_int.Tw2VertexDeclaration.DECL_TEXCOORD, 2, gl.FLOAT, 1, 32));
    declaration.RebuildHash();

    var addEffect0 = new ccpwgl_int.Tw2Effect();
    addEffect0.effectFilePath = 'res:/graphics/effect/web/TrailsAdd0.fx';
    addEffect0.Initialize();

    var addEffect1 = new ccpwgl_int.Tw2Effect();
    addEffect1.effectFilePath = 'res:/graphics/effect/web/TrailsAdd1.fx';
    addEffect1.Initialize();

    var renderEffect = new ccpwgl_int.Tw2Effect();
    renderEffect.effectFilePath = 'res:/graphics/effect/web/TrailsRender.fx';
    renderEffect.parameters['TrailsData0'] = new ccpwgl_int.Tw2TextureParameter('TrailsData0');
    renderEffect.parameters['TrailsData0'].textureRes = rt0.texture;
    renderEffect.parameters['TrailsData1'] = new ccpwgl_int.Tw2TextureParameter('TrailsData1');
    renderEffect.parameters['TrailsData1'].textureRes = rt1.texture;
    renderEffect.parameters['ColorMap'] = new ccpwgl_int.Tw2TextureParameter('ColorMap', 'res:/texture/particle/gradient.dds.0.png');
    renderEffect.Initialize();

    var updateEffect = new ccpwgl_int.Tw2Effect();
    updateEffect.effectFilePath = 'res:/graphics/effect/web/TrailsUpdate.fx';
    updateEffect.parameters['dt'] = new ccpwgl_int.Tw2FloatParameter('dt');
    updateEffect.Initialize();

    var x = 0;
    var y = 0;
    var newData = new Float32Array(vbStride * vbSize * 6);
    var newDataCount = 0;
    var quad = [-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5];
    var fullVBData = new Float32Array(rtSize * rtSize * 4 * 6);

    for (var j = 0; j < rtSize; ++j)
    {
        for (var i = 0; i < rtSize; ++i)
        {
            var t = (i + j * rtSize) * 4 * 6;
            for (k = 0; k < 6; ++k)
            {
                fullVBData[t + 4 * k] = i / 512;
                fullVBData[t + 4 * k + 1] = j / 512;
                fullVBData[t + 4 * k + 2] = quad[k * 2];
                fullVBData[t + 4 * k + 3] = quad[k * 2 + 1];
            }
        }
    }

    var fullVB = gl.createBuffer();
    gl.bindBuffer(device.gl.ARRAY_BUFFER, fullVB);
    gl.bufferData(device.gl.ARRAY_BUFFER, fullVBData, gl.STATIC_DRAW);
    gl.bindBuffer(device.gl.ARRAY_BUFFER, null);
    delete fullVBData;

    var fullVBDeclaration = new ccpwgl_int.Tw2VertexDeclaration();
    fullVBDeclaration.elements.push(new ccpwgl_int.Tw2VertexElement(ccpwgl_int.Tw2VertexDeclaration.DECL_POSITION, 0, gl.FLOAT, 2, 0));
    fullVBDeclaration.elements.push(new ccpwgl_int.Tw2VertexElement(ccpwgl_int.Tw2VertexDeclaration.DECL_TEXCOORD, 0, gl.FLOAT, 2, 8));
    fullVBDeclaration.RebuildHash();

    this.Clear = function ()
    {
        device.SetStandardStates(device.RM_FULLSCREEN);
        rt0.Set();
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        rt1.Set();
        gl.clear(gl.COLOR_BUFFER_BIT);
        rt0.Unset();
    };

    this.Clear();

    function CommitAdd()
    {
        if (newDataCount == 0 || !IsGood())
        {
            newDataCount = 0;
            return;
        }

        device.SetStandardStates(device.RM_FULLSCREEN);
        gl.bindBuffer(gl.ARRAY_BUFFER, vb);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, newData);
        rt0.Set();
        addEffect0.ApplyPass(0);
        var passInput = addEffect0.GetPassInput(0);
        declaration.SetDeclaration(passInput, 4 * vbStride);
        device.ApplyShadowState();
        gl.drawArrays(gl.TRIANGLES, 0, newDataCount * 6);
        rt1.Set();
        addEffect1.ApplyPass(0);
        var passInput = addEffect1.GetPassInput(0);
        declaration.SetDeclaration(passInput, 4 * vbStride);
        device.ApplyShadowState();
        gl.drawArrays(gl.TRIANGLES, 0, newDataCount * 6);
        rt0.Unset();
        newDataCount = 0;
    }

    function IsGood()
    {
        return addEffect0.GetEffectRes().IsGood() && addEffect1.GetEffectRes().IsGood() && renderEffect.GetEffectRes().IsGood();
    }

    function AddTrailPoint(v, color, maxSize)
    {
        var offset = newDataCount * vbStride * 6;
        for (var i = 0; i < 6; ++i)
        {
            newData[offset++] = (quad[i * 2] + x) / rtSize * 2 - 1;
            newData[offset++] = (quad[i * 2 + 1] + y) / rtSize * 2 - 1;
            newData[offset++] = v[0];
            newData[offset++] = v[1];
            newData[offset++] = v[2];
            newData[offset++] = color[0];
            newData[offset++] = color[1];
            newData[offset++] = color[2];
            newData[offset++] = maxSize;
        }

        if (++x == rtSize)
        {
            x = 0;
            if (++y == rtSize)
            {
                y = 0;
            }
        }

        if (++newDataCount == vbSize)
        {
            CommitAdd();
        }
    }

    this.AddTrail = function (prevTrailPoint, nextTrailPoint, color, maxSize)
    {
        if (!prevTrailPoint)
        {
            prevTrailPoint = nextTrailPoint;
            return prevTrailPoint;
        }

        var step = maxSize / 10;
        var dir = vec3.subtract(nextTrailPoint, prevTrailPoint, vec3.create());
        var distance = vec3.length(dir);
        if (distance > step * 300)
        {
            //this.AddTrailPoint(nextTrailPoint, color, maxSize);
            prevTrailPoint = nextTrailPoint;
        }
        else if (distance > 0)
        {
            vec3.scale(dir, 1 / distance);
            while (distance > step)
            {
                AddTrailPoint(prevTrailPoint, color, maxSize);
                prevTrailPoint[0] += dir[0] * step;
                prevTrailPoint[1] += dir[1] * step;
                prevTrailPoint[2] += dir[2] * step;

                var dot = dir[0] * (nextTrailPoint[0] - prevTrailPoint[0]) + dir[1] * (nextTrailPoint[1] - prevTrailPoint[1]) + dir[2] * (nextTrailPoint[2] - prevTrailPoint[2]);

                if (dot < 0)
                {
                    break;
                }
            }
        }
        return prevTrailPoint;
    };

    this.Update = function (dt)
    {
        if (!IsGood())
        {
            return;
        }

        device.SetStandardStates(device.RM_FULLSCREEN);
        device.SetStandardStates(device.RM_ADDITIVE);
        device.SetRenderState(device.RS_SEPARATEALPHABLENDENABLE, 1);
        device.SetRenderState(device.RS_BLENDOPALPHA, device.BLENDOP_ADD);
        device.SetRenderState(device.RS_SRCBLENDALPHA, device.BLEND_ONE);
        device.SetRenderState(device.RS_DESTBLENDALPHA, device.BLEND_ONE);

        rt1.Set();
        updateEffect.parameters['dt'].value = 1 / 600; // Math.min(dt, 1 / 30) * 0.1;
        device.RenderFullScreenQuad(updateEffect);
        rt1.Unset();
    };

    this.Render = function ()
    {
        if (!IsGood())
        {
            return;
        }

        CommitAdd();
        device.SetStandardStates(device.RM_FULLSCREEN);
        device.SetStandardStates(device.RM_ADDITIVE);
        gl.bindBuffer(gl.ARRAY_BUFFER, fullVB);
        renderEffect.ApplyPass(0);
        var passInput = renderEffect.GetPassInput(0);
        fullVBDeclaration.SetDeclaration(passInput, 4 * 4);
        device.ApplyShadowState();
        gl.drawArrays(gl.TRIANGLES, 0, rtSize * rtSize * 6);
    }
};
