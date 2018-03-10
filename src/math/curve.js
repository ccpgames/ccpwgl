export const curve = {};

/**
 * Evaluates a curve
 *
 * @param {{}|Tw2GeometryCurve} curve
 * @param {Array} curve.knots
 * @param {number} curve.degree
 * @param {Array} curve.controls
 * @param {number} curve.dimension
 * @param {number} time
 * @param {*} value
 * @param {boolean} cycle
 * @param {number} duration
 */
curve.evaluate = function (curve, time, value, cycle, duration)
{
    let count = curve.knots.length;
    let knot = count - 1;
    let t = 0;
    for (let i = 0; i < curve.knots.length; ++i)
    {
        if (curve.knots[i] > time)
        {
            knot = i;
            break;
        }
    }

    if (curve.degree === 0)
    {
        for (let i = 0; i < curve.dimension; ++i)
        {
            value[i] = curve.controls[knot * curve.dimension + i];
        }
    }
    else if (curve.degree === 1)
    {
        let knot0 = cycle ? (knot + count - 1) % count : knot === 0 ? 0 : knot - 1;
        let dt = curve.knots[knot] - curve.knots[knot0];

        if (dt < 0)
        {
            dt += duration;
        }

        if (dt > 0)
        {
            t = (time - curve.knots[curve.knots.length - 1]) / dt;
        }

        for (let i = 0; i < curve.dimension; ++i)
        {
            value[i] = curve.controls[knot0 * curve.dimension + i] * (1 - t) + curve.controls[knot * curve.dimension + i] * t;
        }
    }
    else
    {
        let k_2 = cycle ? (knot + count - 2) % count : knot === 0 ? 0 : knot - 2;
        let k_1 = cycle ? (knot + count - 1) % count : knot === 0 ? 0 : knot - 1;

        let p1 = (k_2) * curve.dimension;
        let p2 = (k_1) * curve.dimension;
        let p3 = knot * curve.dimension;

        let ti_2 = curve.knots[k_2];
        let ti_1 = curve.knots[k_1];
        let ti = curve.knots[knot];
        let ti1 = curve.knots[(knot + 1) % count];

        if (ti_2 > ti)
        {
            ti += duration;
            ti1 += duration;
            time += duration;
        }

        if (ti_1 > ti)
        {
            ti += duration;
            ti1 += duration;
            time += duration;
        }

        if (ti1 < ti)
        {
            ti1 += duration;
        }

        let tmti_1 = (time - ti_1);
        let tmti_2 = (time - ti_2);
        let dL0 = ti - ti_1;
        let dL1_1 = ti - ti_2;
        let dL1_2 = ti1 - ti_1;

        let L0 = tmti_1 / dL0;
        let L1_1 = tmti_2 / dL1_1;
        let L1_2 = tmti_1 / dL1_2;

        let ci_2 = (L1_1 + L0) - L0 * L1_1;
        let ci = L0 * L1_2;
        let ci_1 = ci_2 - ci;
        ci_2 = 1 - ci_2;

        for (let i = 0; i < curve.dimension; ++i)
        {
            value[i] = ci_2 * curve.controls[p1 + i] + ci_1 * curve.controls[p2 + i] + ci * curve.controls[p3 + i];
        }
    }
};

/**
 * ag_horner1
 *
 * @param P
 * @param deg
 * @param s
 * @returns {*}
 */
curve.ag_horner1 = function (P, deg, s)
{
    let h = P[deg];
    while (--deg >= 0) h = (s * h) + P[deg];
    return (h);
};

/**
 * ag_zeroin2
 *
 * @param a
 * @param b
 * @param fa
 * @param fb
 * @param tol
 * @param pars
 * @returns {*}
 */
curve.ag_zeroin2 = function (a, b, fa, fb, tol, pars)
{
    let test;
    let c, d, e, fc, del, m, machtol, p, q, r, s;

    /* initialization */
    machtol = 1.192092896e-07;
    let label1 = true;

    /* start iteration */
    while (true)
    {
        if (label1)
        {
            c = a;
            fc = fa;
            d = b - a;
            e = d;
        }

        if (Math.abs(fc) < Math.abs(fb))
        {
            a = b;
            b = c;
            c = a;
            fa = fb;
            fb = fc;
            fc = fa;
        }
        label1 = false;

        /* convergence test */
        del = 2.0 * machtol * Math.abs(b) + 0.5 * tol;
        m = 0.5 * (c - b);
        test = ((Math.abs(m) > del) && (fb !== 0.0));
        if (test)
        {
            if ((Math.abs(e) < del) || (Math.abs(fa) <= Math.abs(fb)))
            {
                /* bisection */
                d = m;
                e = d;
            }
            else
            {
                s = fb / fa;
                if (a === c)
                {
                    /* linear interpolation */
                    p = 2.0 * m * s;
                    q = 1.0 - s;
                }
                else
                {
                    /* inverse quadratic interpolation */
                    q = fa / fc;
                    r = fb / fc;
                    p = s * (2.0 * m * q * (q - r) - (b - a) * (r - 1.0));
                    q = (q - 1.0) * (r - 1.0) * (s - 1.0);
                }
                /* adjust the sign */
                if (p > 0.0) q = -q;
                else p = -p;
                /* check if interpolation is acceptable */
                s = e;
                e = d;
                if ((2.0 * p < 3.0 * m * q - Math.abs(del * q)) && (p < Math.abs(0.5 * s * q)))
                {
                    d = p / q;
                }
                else
                {
                    d = m;
                    e = d;
                }
            }
            /* complete step */
            a = b;
            fa = fb;
            if (Math.abs(d) > del) b += d;
            else if (m > 0.0) b += del;
            else b -= del;
            fb = curve.ag_horner1(pars.p, pars.deg, b);
            if (fb * (fc / Math.abs(fc)) > 0.0)
            {
                label1 = true;
            }
        }
        else
        {
            break;
        }
    }
    return (b);
};

/**
 * ag_zeroin
 *
 * @param a
 * @param b
 * @param tol
 * @param pars
 * @returns {*}
 */
curve.ag_zeroin = function (a, b, tol, pars)
{
    let fa, fb;

    fa = curve.ag_horner1(pars.p, pars.deg, a);
    if (Math.abs(fa) < 1.192092896e-07) return (a);

    fb = curve.ag_horner1(pars.p, pars.deg, b);
    if (Math.abs(fb) < 1.192092896e-07) return (b);

    return (curve.ag_zeroin2(a, b, fa, fb, tol, pars));
};

/**
 * polyZeroes
 *
 * @param Poly
 * @param deg
 * @param a
 * @param a_closed
 * @param b
 * @param b_closed
 * @param Roots
 * @returns {*}
 */
curve.polyZeroes = function (Poly, deg, a, a_closed, b, b_closed, Roots)
{
    let i, left_ok, right_ok, nr, ndr, skip;

    let e, f, s, pe, ps, tol, p, p_x = new Array(22),
        d, d_x = new Array(22),
        dr, dr_x = new Array(22);

    let ply = {
        p: [],
        deg: 0
    };

    e = pe = 0.0;
    f = 0.0;

    for (i = 0; i < deg + 1; ++i)
    {
        f += Math.abs(Poly[i]);
    }
    tol = (Math.abs(a) + Math.abs(b)) * (deg + 1) * 1.192092896e-07;

    /* Zero polynomial to tolerance? */
    if (f <= tol) return (-1);

    p = p_x;
    d = d_x;
    dr = dr_x;
    for (i = 0; i < deg + 1; ++i)
    {
        p[i] = 1.0 / f * Poly[i];
    }

    /* determine true degree */
    while (Math.abs(p[deg]) < tol) deg--;

    /* Identically zero poly already caught so constant fn !== 0 */
    nr = 0;
    if (deg === 0) return (nr);

    /* check for linear case */
    if (deg === 1)
    {
        Roots[0] = -p[0] / p[1];
        left_ok = (a_closed) ? (a < Roots[0] + tol) : (a < Roots[0] - tol);
        right_ok = (b_closed) ? (b > Roots[0] - tol) : (b > Roots[0] + tol);
        nr = (left_ok && right_ok) ? 1 : 0;
        if (nr)
        {
            if (a_closed && Roots[0] < a) Roots[0] = a;
            else if (b_closed && Roots[0] > b) Roots[0] = b;
        }
        return nr;
    }
    /* handle non-linear case */
    else
    {
        ply.p = p;
        ply.deg = deg;

        /* compute derivative */
        for (i = 1; i <= deg; i++) d[i - 1] = i * p[i];

        /* find roots of derivative */
        ndr = curve.polyZeroes(d, deg - 1, a, 0, b, 0, dr);
        if (ndr.length === 0) return (0);

        /* find roots between roots of the derivative */
        for (i = skip = 0; i <= ndr; i++)
        {
            if (nr > deg) return (nr);
            if (i === 0)
            {
                s = a;
                ps = curve.ag_horner1(p, deg, s);
                if (Math.abs(ps) <= tol && a_closed) Roots[nr++] = a;
            }
            else
            {
                s = e;
                ps = pe;
            }
            if (i === ndr)
            {
                e = b;
                skip = 0;
            }
            else e = dr[i];
            pe = curve.ag_horner1(p, deg, e);
            if (skip) skip = 0;
            else
            {
                if (Math.abs(pe) < tol)
                {
                    if (i !== ndr || b_closed)
                    {
                        Roots[nr++] = e;
                        skip = 1;
                    }
                }
                else if ((ps < 0 && pe > 0) || (ps > 0 && pe < 0))
                {
                    Roots[nr++] = curve.ag_zeroin(s, e, 0.0, ply);
                    if ((nr > 1) && Roots[nr - 2] >= Roots[nr - 1] - tol)
                    {
                        Roots[nr - 2] = (Roots[nr - 2] + Roots[nr - 1]) * 0.5;
                        nr--;
                    }
                }
            }
        }
    }

    return (nr);
};