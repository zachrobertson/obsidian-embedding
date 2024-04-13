import { svd } from './svd';
import { Matrix, index, range, subtract, mean, sqrt, concat, min, reshape, multiply } from 'mathjs';

interface MeanVarianceCalc {
    inc_mean: number,
    inc_variance: number;
    samples: number;
}

export class IPCA {
    // Class config variables
    nComponents: number;
    batchSize: number;

    // Fit function helper variables
    batch_size_: number;
    components_: any;
    n_components_: any;
    n_samples_seen_: any;
    mean_: any;
    var_: any;
    singular_values_: any;
    explained_variance_: any;
    explained_variance_ratio_: any;
    noise_variance_: any;

    constructor(nComponents: number = 2, batchSize: number=NaN) {
        this.nComponents = nComponents;
        this.batchSize = batchSize;
    }

    *gen_batches(n: number, batch_size: number, min_batch_size: number = 0): IterableIterator<number[]> {
        let start = 0;
        for (let _ = 0; _ < Math.floor(n / batch_size); _++) {
            let end = start + batch_size;
            if (end + min_batch_size > n) {
                continue;
            }
            yield Array.from({length: end - start}, (_, k) => k + start);
            start = end;
        }
        if (start < n) {
            yield Array.from({length: n - start}, (_, k) => k + start);
        }
    }

    private incremental_mean_and_var(X: Matrix, last_mean: number, last_variance: number): MeanVarianceCalc {
        // WIP
        const inc_mean = last_mean;
        const inc_variance = 0.0;
        const samples = 0;
        return {
            inc_mean,
            inc_variance,
            samples
        }
    }

    private partial_fit(X: Matrix): void {
        let x_ = X;
        const size_ = x_.size();
        const [n_samples, n_features] = size_;

        if (this.nComponents === undefined) {
            if (this.components_ === undefined) {
                this.n_components_ = min(n_samples, n_features);
            }
            else {
                this.n_components_= this.components_.size()[0];
            }
        } else {
            this.n_components_= this.nComponents;
        }

        // TODO: update method with correct logic
        const { inc_mean, inc_variance, samples } = this.incremental_mean_and_var(
            x_,
            this.mean_,
            this.var_
        )

        if (this.n_samples_seen_ === 0) {
            x_ = subtract(x_, inc_mean) as Matrix;
        } else {
            const batch_mean = mean(x_, 0) as number;
            x_ = subtract(x_, batch_mean) as Matrix;

            const mean_correction = sqrt(
                (this.n_samples_seen_ / samples) * n_samples
            ) as number * (this.mean_ - batch_mean);
            x_ = concat(
                multiply(reshape(this.singular_values_, [-1, 1]), this.components_),
                x_,
                mean_correction
            ) as Matrix;
        }

        const { q, u, v } = svd({ a: x_ });
    }

    public fit(X: Matrix) {
        this.components_ = undefined;
        this.n_samples_seen_ = 0;
        this.mean_ = 0.0;
        this.var_ = 0.0;
        this.singular_values_ = undefined;
        this.explained_variance_ = undefined;
        this.explained_variance_ratio_ = undefined;
        this.noise_variance_ = undefined;

        const size_ = X.size();
        const [n_samples, n_features] = size_;

        if (Number.isNaN(this.batchSize)) {
            this.batch_size_ = 5 * n_features;
        } else {
            this.batch_size_ = this.batchSize;
        }

        for (const batch of this.gen_batches(n_samples, this.batch_size_)) {
            const batch_start = batch.at(0);
            const batch_end = batch.at(-1);
            if (batch_start === undefined || batch_end === undefined) {
                throw new Error('Batch is empty!')
            }
            const input_batch = X.subset(index(range(batch_start, batch_end + 1), range(0, n_features)));
            this.partial_fit(input_batch);
        }
    }

    transform(X: Matrix): Matrix {
        return X
    }
}