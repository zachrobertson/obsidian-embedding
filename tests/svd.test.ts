import { Matrix, matrix } from 'mathjs';
import { svd, SVDResponse } from '../svd';
import { describe, expect, test } from '@jest/globals';

describe('#svd', () => {
    test('decompose: default', () => {
        const a: Matrix = matrix([
            [4, 11, 14],
            [5, 6, 7],
            [8, 9, 10],
            [11, 12, 13],
        ]);

        const expected: SVDResponse = {
            q: matrix([
                33.11853656036826, 5.013102015073421, 0.1770431755774416,
            ]),
            u: matrix([
                [-0.536212983892352, -0.8376185320663777, 0.10426327562582624],
                [
                    -0.31631300579052934, 0.09658141364164574,
                    -0.8508533635357359,
                ],
                [
                    -0.4707376177653273, 0.27829968100893604,
                    -0.18517212561366322,
                ],
                [-0.6251622297401253, 0.4600179483762262, 0.4805091123084093],
            ]),
            v: matrix([
                [
                    -0.43386888208644575, 0.8814956900668569,
                    -0.18634146492558698,
                ],
                [-0.5898450898855566, -0.12156203074519195, 0.7983141252783924],
                [
                    -0.6810584138640071, -0.45627625521679405,
                    -0.5726878869247906,
                ],
            ]),
        };
        const result = svd({ a });

        expect(result.q).toEqual(expected.q);
        expect(result.v).toEqual(expected.v);
        expect(result.u).toEqual(expected.u);
    });
});
