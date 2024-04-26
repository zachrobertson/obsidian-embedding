import PCA from '../pca';
import { matrix } from 'mathjs';
import { describe, expect, test } from '@jest/globals';

const TEST_MATRIX = matrix([
    [4, 11, 14],
    [5, 6, 7],
    [8, 9, 10],
    [11, 12, 13],
]);

describe('IPCA', function () {
    describe('#getEigenVectors()', function () {
        const expectedEigenvectors = [
            [0.43574756430092315, 0.6072235155214551, 0.6643821659282992],
            [-0.8784432376336416, 0.12607532198312935, 0.46091484185538634],
            [0.19611613513818404, -0.7844645405527362, 0.5883484054145521],
        ];

        test('should transform input matrix and output matrix with correct dimensions', function () {
            const eigenvectors = PCA.getEigenVectors(TEST_MATRIX);

            expect(eigenvectors.size()).toEqual([
                expectedEigenvectors.length,
                expectedEigenvectors[0].length,
            ]);
        });
    });
});
