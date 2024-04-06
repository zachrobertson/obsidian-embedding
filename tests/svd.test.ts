import { Matrix, matrix } from 'mathjs';
import { svd, SVDResponse } from '../svd';
import { describe, expect, test } from '@jest/globals';

describe('svd', () => {
    test('should correctly decompose a matrix', () => {
        const a: Matrix = matrix([
            [4, 11, 14], 
            [5, 6, 7],
            [8, 9, 10],
            [11, 12, 13]
        ]);
        // values from the scipy.linalg.svd method
        const expected: SVDResponse = {
            q: matrix([
                [33.11853656, 5.01310202, 0.17704318]
            ]),
            u: matrix([
                [-5.36212984e-01, 8.37618532e-01, -1.04263276e-01, 4.21688032e-16],
                [-3.16313006e-01, -9.65814136e-02, 8.50853364e-01, 4.08248290e-01],
                [-4.70737618e-01, -2.78299681e-01, 1.85172126e-01, -8.16496581e-01],
                [-6.25162230e-01, -4.60017948e-01, -4.80509112e-01, 4.08248290e-01]
            ]),
            v: matrix([
                [-0.43386888, -0.58984509, -0.68105841],
                [-0.88149569, 0.12156203, 0.45627626],
                [ 0.18634146, -0.79831413, 0.57268789]
            ])
        };
        const result = svd(a);

        expect(result.q).toEqual(expected.q);
        expect(result.u).toEqual(expected.u);
        expect(result.v).toEqual(expected.v);
    });
});
