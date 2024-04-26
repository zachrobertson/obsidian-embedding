import { svd } from './svd';
import { Matrix, subtract, multiply, ones, transpose } from 'mathjs';

export default class PCA {
    constructor() {}

    static deviation(a: Matrix): Matrix {
        const batchSize = a.size()[0];
        const unitMatrix = ones([batchSize, batchSize]);
        return subtract(a, multiply(multiply(unitMatrix, a), 1 / batchSize));
    }

    static variance(a: Matrix): Matrix {
        const sumOfSquares = multiply(transpose(a), a);
        return sumOfSquares;
    }

    static varianceCovariance(sumOfSquares: Matrix): Matrix {
        const varCovar = multiply(sumOfSquares, 1 / sumOfSquares.size()[0]);
        return varCovar;
    }

    static computeSVD(a: Matrix): Matrix {
        const result = svd({ a });
        const eigenvectors = result.u;
        return multiply(transpose(eigenvectors), -1);
    }

    static getEigenVectors(data: Matrix) {
        const deviation = this.deviation(data);
        const variance = this.variance(deviation);
        const varCovar = this.varianceCovariance(variance);
        const results = this.computeSVD(varCovar);
        return results;
    }
}
