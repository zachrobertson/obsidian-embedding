import * as fs from 'fs';
import { isUndefined } from 'mathjs';

export interface Vector {
    id: string;
    fullEmbedding: number[];
    reducedEmbedding: number[];
}

export interface SearchResponse extends Vector {
    distance: number;
}

interface VectorUpdate {
    fullEmbedding?: number[];
    reducedEmbedding?: number[];
}

export class VectorDatabase {
    public vectors: Map<string, Vector>;
    public filePath: string;

    constructor(filePath: string) {
        this.vectors = new Map();
        this.filePath = filePath;
    }

    private calculateDistance(vectorA: number[], vectorB: number[]): number {
        if (vectorA.length !== vectorB.length) {
            throw new Error('Vectors must be of the same dimension.');
        }

        let sum = 0;
        for (let i = 0; i < vectorA.length; i++) {
            let diff = vectorA[i] - vectorB[i];
            sum += diff * diff;
        }

        return Math.sqrt(sum);
    }

    public fullEmbeddings() {
        return Array.from(this.vectors.values()).map(
            (vector) => vector.fullEmbedding,
        );
    }

    public ids() {
        return Array.from(this.vectors.values()).map((vector) => vector.id);
    }

    public add(vector: Vector) {
        console.log(`Adding vector to database: ${vector.id}`);
        this.vectors.set(vector.id, vector);
    }

    public update(id: string, vectorUpdate: VectorUpdate) {
        console.log(`Updating vector with ID: ${id}`);
        let vector = this.vectors.get(id);
        if (isUndefined(vector))
            throw new Error(`ID does not exist in database: ${id}`);
        vector = {
            ...vector,
            ...vectorUpdate,
        };
        this.vectors.set(vector.id, vector);
    }

    public get(id: string): Vector | undefined {
        return this.vectors.get(id);
    }

    public has(id: string): Boolean {
        return this.vectors.has(id);
    }

    public delete(id: string): Boolean {
        return this.vectors.delete(id);
    }

    public search(queryVector: number[], n?: number): SearchResponse[] {
        const distances = Array.from(this.vectors.values()).map((vector) => {
            return {
                id: vector.id,
                distance: this.calculateDistance(
                    queryVector,
                    vector.fullEmbedding,
                ),
            };
        });

        distances.sort((a, b) => a.distance - b.distance);

        let closestVectors: SearchResponse[];
        if (n !== undefined) {
            closestVectors = distances.slice(0, n).map((d) => {
                let vector = this.vectors.get(d.id);
                return {
                    ...vector,
                    distance: d.distance,
                } as SearchResponse;
            });
        } else {
            closestVectors = distances.map((d) => {
                let vector = this.vectors.get(d.id);
                return {
                    ...vector,
                    distance: d.distance,
                } as SearchResponse;
            });
        }
        return closestVectors;
    }

    public serialize(): string {
        return JSON.stringify(Array.from(this.vectors.values()));
    }

    public deserialize(jsonString: string) {
        const vectors: Vector[] = JSON.parse(jsonString);
        vectors.forEach((vector) => this.add(vector));
    }

    public saveToFile() {
        console.log(`Saving database in file: ${this.filePath}`);
        const data = this.serialize();
        fs.writeFileSync(this.filePath, data, 'utf-8');
    }

    public loadFromFile() {
        if (fs.existsSync(this.filePath)) {
            const data = fs.readFileSync(this.filePath, 'utf-8');
            this.deserialize(data);
        }
    }
}
