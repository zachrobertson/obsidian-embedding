import * as fs from 'fs';

interface Vector {
    id: string;
    fullEmbedding: number[];
    reducedEmbedding: number[];
}

export default class VectorDatabase {
    private vectors: Map<string, Vector>;
    private filePath: string;

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

    public static l2Normalization(vector: number[]): number[] {
        return [0, 0, 0]
    }

    public add(vector: Vector) {
        console.log(`Adding vector to database: ${vector.id}`)
        this.vectors.set(vector.id, vector)
    }

    public get(id: string): Vector | undefined {
        return this.vectors.get(id);
    }

    public has(id: string): Boolean {
        return this.vectors.has(id);
    }

    public search(queryId: string, n: number): Vector[] {
        const queryVector = this.vectors.get(queryId);
        if (!queryVector) {
            throw new Error(`Vector with id ${queryId} not found in database.`);
        }

        const distances = Array.from(this.vectors.values()).map(vector => {
            return {
                id: vector.id,
                distance: this.calculateDistance(queryVector.fullEmbedding, vector.fullEmbedding)
            };
        });

        distances.sort((a, b) => a.distance - b.distance);

        const closestVectors = distances.slice(0, n).map(d => this.vectors.get(d.id)) as Vector[];

        return closestVectors;
    }

    public serialize(): string {
        return JSON.stringify(Array.from(this.vectors.values()));
    }

    public deserialize(jsonString: string) {
        const vectors: Vector[] = JSON.parse(jsonString);
        vectors.forEach(vector => this.add(vector));
    }

    public saveToFile() {
        console.log(`Saving database in file: ${this.filePath}`)
        const data = this.serialize();
        fs.writeFileSync(this.filePath, data, "utf-8");
    }

    public loadFromFile() {
        if (fs.existsSync(this.filePath)) {
            const data = fs.readFileSync(this.filePath, 'utf-8');
            this.deserialize(data);
        }
    }
}
