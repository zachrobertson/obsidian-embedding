"use strict";
exports.__esModule = true;
exports.svd = void 0;
var mathjs_1 = require("mathjs");
/** SVD algorithm from "Singular Value Decomposition and Least Squares Solutions. By G.H. Golub et al."
 *
 *  Computation of the singular values and complete orthogonal decomposition of a real rectangular matrix a
 *  @param a {Matrix} Matrix to decompose
 *  @param withu {bool} {true} if u is desired {false} otherwise
 *  @param withv {bool} {true} if v is desired {false} otherwise
 *  @param eps {Number} Convergence threshold
 *  @param tol {Number} Machine specific constant. Should be equal to B/eps0 where B is the smallest positive number that can be represented on the current machine
 *
 *  @returns {Object} An object containing:
 *    q: Singular values of A
 *    u: Represents the matrix U with orthonormalized columns (if withu is {true} otherwise u is used as
 *      a working storage)
 *    v: Represents the orthogonal matrix V (if withv is {true}, otherwise v is not used)
 *
 */
function svd(a, withu, withv, eps, tol) {
    if (withu === void 0) { withu = true; }
    if (withv === void 0) { withv = true; }
    if (eps === void 0) { eps = Math.pow(2, -52); }
    if (tol === void 0) { tol = (Number.MIN_VALUE / eps); }
    if (a.size().length != 2) {
        throw new Error("Decomposition of matrix cannot be computed for matrix with more than 2 dimensions: ".concat(a.size()));
    }
    var _a = a.size(), m = _a[0], n = _a[1];
    if (m < n) {
        throw new Error("Number of rows (n) must be greater than number of columns (m). Current values are n: ".concat(n, ", m: ").concat(m));
    }
    // Householder's reduction to bidiagonal form
    var e = (0, mathjs_1.matrix)((0, mathjs_1.zeros)([1, n]));
    var q = (0, mathjs_1.matrix)((0, mathjs_1.zeros)([1, n]));
    var v = (0, mathjs_1.matrix)((0, mathjs_1.zeros)([1, n]));
    var g, x, s, l, h, f, y, z, c, ll;
    g = 0;
    x = 0;
    // Householder's reduction to bidiagonal form;
    var u = a.clone();
    for (var i = 0; i < n; i++) {
        e.set([0, i], g);
        s = 0;
        l = i + 1;
        for (var j = i; j < m; j++) {
            s += (0, mathjs_1.pow)(u.get([j, i]), 2);
        }
        if (s < tol) {
            g = 0;
        }
        else {
            f = u.get([i, i]);
            g = (f < 0 ? (0, mathjs_1.sqrt)(s) : -(0, mathjs_1.sqrt)(s));
            h = (f * g) - s;
            u.set([i, i], f - g);
            for (var j = l; j < n; j++) {
                s = 0;
                for (var k = i; k < m; k++) {
                    s += u.get([k, i]) * u.get([k, j]);
                }
                f = s / h;
                for (var k = i; k < m; k++) {
                    u.set([k, j], u.get([k, j]) + f * u.get([k, i]));
                }
            }
        }
        q.set([0, i], g);
        s = 0;
        for (var j = l; j < n; j++) {
            s += (0, mathjs_1.pow)(u.get([i, j]), 2);
        }
        if (s < tol) {
            g = 0;
        }
        else {
            f = u.get([i, i + 1]);
            g = (f < 0 ? (0, mathjs_1.sqrt)(s) : -(0, mathjs_1.sqrt)(s));
            h = (f * g) - s;
            u.set([i, i + 1], f - g);
            for (var j = l; j < n; j++) {
                e.set([0, j], u.get([i, j]) / h);
            }
            for (var j = l; j < m; j++) {
                s = 0;
                for (var k = l; k < n; k++) {
                    s += u.get([j, k]) * u.get([i, k]);
                }
                for (var k = l; k < n; k++) {
                    u.set([j, k], u.get([j, k]) + s * e.get([0, k]));
                }
            }
        }
        y = (0, mathjs_1.abs)(q.get([0, i])) + (0, mathjs_1.abs)(e.get([0, i]));
        if (y > x) {
            x = y;
        }
    }
    // Accumulation of right-hand transformations
    if (withv) {
        for (var i = n - 1; i >= 0; i--) {
            if (g !== 0) {
                h = u.get([i, i + 1]) * g;
                for (var j = l; j < n; j++) {
                    v.set([j, i], u.get([i, j]) / h);
                }
                for (var j = l; j < n; j++) {
                    s = 0;
                    for (var k = l; k < n; k++) {
                        s += u.get([i, k]) * v.get([k, j]);
                    }
                    for (var k = l; k < n; k++) {
                        v.set([k, j], v.get([k, j]) + s * v.get([k, i]));
                    }
                }
            }
            for (var j = l; j < n; j++) {
                v.set([i, j], 0), v.set([j, i], 0);
            }
            v.set([i, i], 1);
            g = e.get([0, i]);
            l = i;
        }
    }
    // Accumulation of left-hand transformations
    if (withu) {
        for (var i = n - 1; i >= 0; i--) {
            l = i + 1;
            g = q.get([0, i]);
            if (g !== 0) {
                h = u.get([i, i]) * g;
                for (var j = l; j < n; j++) {
                    s = 0;
                    for (var k = l; k < m; k++) {
                        s += u.get([k, i]) * u.get([k, j]);
                    }
                    f = s / h;
                    for (var k = l; k < m; k++) {
                        u.set([k, j], u.get([k, j]) + f * u.get([k, i]));
                    }
                }
                for (var j = i; j < m; j++) {
                    u.set([j, i], u.get([j, i]) / g);
                }
            }
            else {
                for (var j = i; j < m; j++) {
                    u.set([j, i], 0);
                }
            }
            u.set([i, i], u.get([i, i]) + 1);
        }
    }
    function _test_f_convergence(k, l) {
        z = q.get([0, k]);
        if (l === k) {
            if (z < 0) {
                q.set([0, k], -z);
                if (withv) {
                    for (var j = 0; j < n; j++) {
                        v.set([j, k], -v.get([j, k]));
                    }
                }
            }
            return true;
        }
        return false;
    }
    function _cancellation(k, l) {
        // cancellation of e[l] if l > 1
        c = 0, s = 1, ll = l - 1;
        for (var i = l; i < k + 1; i++) {
            f = s * e.get([0, i]);
            e.set([0, i], c * e.get([0, i]));
            if ((0, mathjs_1.abs)(f) <= eps) {
                return _test_f_convergence(k, l);
            }
            g = q.get([0, i]);
            h = (0, mathjs_1.sqrt)((f * f) + (g * g));
            q.set([0, i], h);
            c = g / h;
            s = -f / h;
            if (withu) {
                for (var j = 0; j < m; j++) {
                    y = u.get([j, ll]);
                    z = u.get([j, i]);
                    u.set([j, ll], (y * c) + (z * s));
                    u.set([j, i], (-y * s) + (z * c));
                }
            }
        }
        return false;
    }
    function _test_f_splitting(k) {
        for (var l_1 = k; l_1 >= 0; l_1--) {
            if ((0, mathjs_1.abs)(e.get([0, l_1])) <= eps) {
                // test convergence -> break out of loop "l" and run inside of k loop
                return _test_f_convergence(k, l_1);
            }
            else if ((0, mathjs_1.abs)(q.get([0, l_1 - 1])) <= eps) {
                // cancellation -> break out of loop "l" and run inside of k loop
                return _cancellation(k, l_1);
            }
        }
        return false;
    }
    // diagonalization of the bidiagonal form
    eps = eps * x;
    for (var k = n - 1; k >= 0; k--) {
        // run test_f_splitting in current "k" loop context
        var split = _test_f_splitting(k);
        if (!split) {
            // shift from bottom 2x2 minor
            x = q.get([0, l]);
            y = q.get([0, k - 1]);
            g = e.get([0, k - 1]);
            h = e.get([0, k]);
            z = z;
            f = ((y - z) * (y + z) + (g - h) * (g + h)) / (2 * h * y);
            g = (0, mathjs_1.sqrt)(f * f + 1);
            f = ((x - z) * (x + z) + (h * (y / (f < 0 ? (f - g) : (f + g)) - h))) / x;
            // Next QR transformation
            c = 1;
            s = 1;
            for (var i = l + 1; i < k + 1; i++) {
                g = e.get([0, i]);
                y = q.get([0, i]);
                h = s * g;
                g = c * g;
                z = (0, mathjs_1.sqrt)(f * f + g * g);
                e.set([0, i - 1], z);
                c = f / z;
                s = h / z;
                f = x * c + g * s;
                g = -(x * s) + g * c;
                h = y * s;
                y = y * c;
                if (withv) {
                    for (var j = 0; j < n; j++) {
                        x = v.get([j, i - 1]);
                        z = v.get([j, i]);
                        v.set([j, i - 1], (x * c) + (z * s));
                        v.set([j, i], (-x * s) + (z * c));
                    }
                }
                z = (0, mathjs_1.sqrt)(f * f + h * h);
                q.set([0, i - 1], z);
                c = f / z;
                s = h / z;
                f = c * g + s * y;
                x = -(s * g) + c * y;
                if (withu) {
                    for (var j = 0; j < m; j++) {
                        y = u.get([j, i - 1]);
                        z = u.get([j, i]);
                        u.set([j, i - 1], (y * c) + (z * s));
                        u.set([j, i], (-y * s) + (z * c));
                    }
                }
            }
            e.set([0, l], 0);
            e.set([0, k], f);
            q.set([0, k], x);
        }
    }
    return {
        q: q,
        u: u,
        v: v
    };
}
exports.svd = svd;
