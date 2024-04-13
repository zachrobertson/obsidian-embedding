import { IPCA } from '../pca';
import { matrix } from 'mathjs';
import { describe, expect, test } from '@jest/globals';

describe.skip('IPCA', function() {
    describe('#transform()', function() {
        test.skip('should transform input matrix and output matrix with correct dimensions', function() {
            const numOutputFeatures = 3;
            const ipca = new IPCA(numOutputFeatures);
            const inputMatrix = matrix([
                [1, 2, 3, 4, 5],
                [6, 7, 8, 9, 10],
                [11, 12, 13, 14, 15],
                [16, 17, 18, 19, 20]
            ]);

            const outputMatrix = ipca.transform(inputMatrix);
            expect(outputMatrix.size()).toEqual([inputMatrix.size()[0], numOutputFeatures]);
        });
    });
    describe('#fit()', function() {
        test.skip('should fit to dataset', function() {
            const ipca = new IPCA(undefined, 5);
            const inputMatrix = matrix(Array.from({length: 25}, (_, i) => 
                Array.from({length: 5}, (_, j) => i * 5 + j + 1)
            ));

            ipca.fit(inputMatrix);
        });
    });
});
