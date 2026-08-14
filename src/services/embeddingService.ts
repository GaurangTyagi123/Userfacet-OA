/**
 * src/services/embeddingService.ts
 * Service module for creating text embeddings via an external provider.
 * Exports functions used by other services/controllers that require vector
 * representations of text.
 */
import { pipeline } from "@huggingface/transformers";

interface FeatureExtractor {
    (text: string, options: PoolingOptions): Promise<EmbeddingOutput>;
}

interface PoolingOptions {
    pooling: string;
    normalize: boolean;
}

interface EmbeddingOutput {
    data: ArrayLike<number>;
}

let extractor: FeatureExtractor | null = null;

async function getExtractor(): Promise<FeatureExtractor> {
    if (!extractor) {
        extractor = (await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2",
        )) as FeatureExtractor;
    }

    return extractor as FeatureExtractor;
}

export async function generateEmbedding(text: string): Promise<number[]> {
    const model = await getExtractor();

    const output = await model(text, {
        pooling: "mean",
        normalize: true,
    });

    return Array.from(output.data);
}
