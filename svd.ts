import { Matrix, matrix, sqrt, zeros, pow, abs } from 'mathjs';

export interface SVDResponse {
    q: Matrix;
    u: Matrix;
    v: Matrix;
}

export interface SVDInput {
    a: Matrix;
    withu?: boolean;
    withv?: boolean;
    eps?: number;
    tol?: number;
    qr_iters?: number;
}

/** SVD algorithm from "Singular Value Decomposition and Least Squares Solutions. By G.H. Golub et al."
 *
 *  Computation of the singular values and complete orthogonal decomposition of a real rectangular matrix a
 *  @param a {Matrix} Matrix to decompose
 *  @param withu {bool} {true} if u is desired {false} otherwise
 *  @param withv {bool} {true} if v is desired {false} otherwise
 *  @param eps {Number} Convergence threshold
 *  @param tol {Number} Machine specific constant. Should be equal to B/eps0 where B is the smallest positive number that can be represented on the current machine
 *  @param qr_iters {Number} Number of QR Transformations to complete for the matrix diagonalization
 *
 *  @returns {Object} An object containing:
 *    q: Singular values of A
 *    u: Represents the matrix U with orthonormalized columns (if withu is {true} otherwise u is used as
 *      a working storage)
 *    v: Represents the orthogonal matrix V (if withv is {true}, otherwise v is not used)
 */
export function svd(input: SVDInput): SVDResponse {
    const {
        a,
        withu: _withu,
        withv: _withv,
        eps: _eps,
        tol: _tol,
        qr_iters: _qr_iters,
    } = input;

    const withu: boolean = _withu !== undefined ? _withu : true;
    const withv: boolean = _withv !== undefined ? _withv : true;
    let eps: number = _eps !== undefined ? _eps : (pow(2, -52) as number);
    const tol: number = _tol !== undefined ? _tol : 1e-64 / eps;
    const qr_iters: number = _qr_iters !== undefined ? _qr_iters : 10;

    if (a.size().length != 2) {
        throw new Error(
            `Decomposition of matrix cannot be computed for matrix with more than 2 dimensions: ${a.size()}`,
        );
    }

    const [m, n] = a.size();
    if (m < n) {
        throw new Error(
            `Number of rows (n) must be greater than number of columns (m). Current values are n: ${n}, m: ${m}`,
        );
    }

    // Householder's reduction to bidiagonal form
    const e = matrix(zeros([n]));
    const q = matrix(zeros([n]));
    const v = matrix();
    let g, x, s, l, h, f, y, z, c, l1;
    g = 0;
    x = 0;

    // Householder's reduction to bidiagonal form;
    const u = a.clone();
    for (let i = 0; i < n; i++) {
        e.set([i], g);
        s = 0;
        l = i + 1;
        for (let j = i; j < m; j++) {
            s += pow(u.get([j, i]), 2) as number;
        }
        if (s < tol) {
            g = 0;
        } else {
            f = u.get([i, i]);
            g = (f < 0 ? sqrt(s) : -sqrt(s)) as number;
            h = f * g - s;
            u.set([i, i], f - g);
            for (let j = l; j < n; j++) {
                s = 0;
                for (let k = i; k < m; k++) {
                    s += u.get([k, i]) * u.get([k, j]);
                }
                f = s / h;
                for (let k = i; k < m; k++) {
                    u.set([k, j], u.get([k, j]) + f * u.get([k, i]));
                }
            }
        }
        q.set([i], g);
        s = 0;
        for (let j = l; j < n; j++) {
            s += pow(u.get([i, j]), 2) as number;
        }
        if (s < tol) {
            g = 0;
        } else {
            f = u.get([i, i + 1]);
            g = (f < 0 ? sqrt(s) : -sqrt(s)) as number;
            h = f * g - s;
            u.set([i, i + 1], f - g);
            for (let j = l; j < n; j++) {
                e.set([j], u.get([i, j]) / h);
            }
            for (let j = l; j < m; j++) {
                s = 0;
                for (let k = l; k < n; k++) {
                    s += u.get([j, k]) * u.get([i, k]);
                }
                for (let k = l; k < n; k++) {
                    u.set([j, k], u.get([j, k]) + s * e.get([k]));
                }
            }
        }
        y = abs(q.get([i])) + abs(e.get([i]));
        if (y > x) {
            x = y;
        }
    }

    // Accumulation of right-hand transformations
    if (withv) {
        for (let i = n - 1; i >= 0; i--) {
            if (g !== 0) {
                h = u.get([i, i + 1]) * g;
                for (let j = l as number; j < n; j++) {
                    v.set([j, i], u.get([i, j]) / h);
                }
                for (let j = l as number; j < n; j++) {
                    s = 0;
                    for (let k = l as number; k < n; k++) {
                        s += u.get([i, k]) * v.get([k, j]);
                    }
                    for (let k = l as number; k < n; k++) {
                        v.set([k, j], v.get([k, j]) + s * v.get([k, i]));
                    }
                }
            }
            for (let j = l as number; j < n; j++) {
                v.set([i, j], 0), v.set([j, i], 0);
            }
            v.set([i, i], 1);
            g = e.get([i]);
            l = i;
        }
    }

    // Accumulation of left-hand transformations
    if (withu) {
        for (let i = n - 1; i >= 0; i--) {
            l = i + 1;
            g = q.get([i]);
            for (let j = l; j < n; j++) {
                u.set([i, j], 0);
            }
            if (g !== 0) {
                h = u.get([i, i]) * g;
                for (let j = l; j < n; j++) {
                    s = 0;
                    for (let k = l; k < m; k++) {
                        s += u.get([k, i]) * u.get([k, j]);
                    }
                    f = s / h;
                    for (let k = i; k < m; k++) {
                        u.set([k, j], u.get([k, j]) + f * u.get([k, i]));
                    }
                }
                for (let j = i; j < m; j++) {
                    u.set([j, i], u.get([j, i]) / g);
                }
            } else {
                for (let j = i; j < m; j++) {
                    u.set([j, i], 0);
                }
            }
            u.set([i, i], u.get([i, i]) + 1);
        }
    }

    function _test_f_convergence(k: number, l: number): boolean {
        z = q.get([k]) as number;
        if (l === k) {
            if (z < 0) {
                q.set([k], -z);
                if (withv) {
                    for (let j = 0; j < n; j++) {
                        v.set([j, k], -v.get([j, k]));
                    }
                }
            }
            return true;
        }
        return false;
    }

    function _cancellation(k: number, l: number): boolean {
        // cancellation of e[l] if l > 1
        (c = 0), (s = 1), (l1 = l - 1);
        for (let i = l; i < k + 1; i++) {
            f = s * e.get([i]);
            e.set([i], c * e.get([i]));
            if (abs(f) <= eps) {
                return true;
            }
            g = q.get([i]);
            h = sqrt(f * f + g * g) as number;
            q.set([i], h);
            c = g / h;
            s = -f / h;
            if (withu) {
                for (let j = 0; j < m; j++) {
                    y = u.get([j, l1]);
                    z = u.get([j, i]);
                    u.set([j, l1], y * c + z * s);
                    u.set([j, i], -y * s + z * c);
                }
            }
        }
        return false;
    }

    function _test_f_splitting(k: number): boolean {
        for (l = k; l >= 0; l--) {
            if (abs(e.get([l])) <= eps) {
                // test convergence -> break out of loop "l" and run inside of k loop
                return true;
            } else if (abs(q.get([l - 1])) <= eps) {
                // cancellation -> break out of loop "l" and run inside of k loop
                return false;
            }
        }
        return false;
    }

    // diagonalization of the bidiagonal form
    eps = eps * x;
    for (let k = n - 1; k >= 0; k--) {
        for (let iteration = 0; iteration < qr_iters; iteration++) {
            // run test_f_splitting in current "k" loop context
            if (!_test_f_splitting(k)) {
                if (_cancellation(k, l as number)) {
                    continue;
                }
            }

            if (_test_f_convergence(k, l as number)) {
                continue;
            }

            // shift from bottom 2x2 minor
            x = q.get([l as number]);
            y = q.get([k - 1]);
            g = e.get([k - 1]);
            h = e.get([k]);
            z = z as number;
            f = ((y - z) * (y + z) + (g - h) * (g + h)) / (2 * h * y);
            g = sqrt(f * f + 1) as number;
            f = ((x - z) * (x + z) + h * (y / (f < 0 ? f - g : f + g) - h)) / x;

            // Next QR transformation
            c = 1;
            s = 1;
            for (let i = (l as number) + 1; i < k + 1; i++) {
                g = e.get([i]);
                y = q.get([i]);
                h = s * g;
                g = c * g;
                z = sqrt(f * f + h * h) as number;
                e.set([i - 1], z);
                c = f / z;
                s = h / z;
                f = x * c + g * s;
                g = -x * s + g * c;
                h = y * s;
                y = y * c;
                if (withv) {
                    for (let j = 0; j < n; j++) {
                        x = v.get([j, i - 1]);
                        z = v.get([j, i]);
                        v.set([j, i - 1], x * c + z * s);
                        v.set([j, i], -x * s + z * c);
                    }
                }
                z = sqrt(f * f + h * h) as number;
                q.set([i - 1], z);
                c = f / z;
                s = h / z;
                f = c * g + s * y;
                x = -s * g + c * y;
                if (withu) {
                    for (let j = 0; j < m; j++) {
                        y = u.get([j, i - 1]);
                        z = u.get([j, i]);
                        u.set([j, i - 1], y * c + z * s);
                        u.set([j, i], -y * s + z * c);
                    }
                }
            }
            e.set([l as number], 0);
            e.set([k], f);
            q.set([k], x);
        }
    }

    return {
        q,
        u,
        v,
    };
}
