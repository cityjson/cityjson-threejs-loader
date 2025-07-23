import { Group, Matrix4, Box3 } from 'three';
import { CityJSONWorkerParser } from '../parsers/CityJSONWorkerParser';

interface FcbMetadata {
    columns: Record<string, any>;
    featureCount: number;
    dataExtent: {
        minX: number;
        minY: number;
        minZ: number;
        maxX: number;
        maxY: number;
        maxZ: number;
    } | null;
}

interface FcbFeature {
    id?: string;
    type?: string;
    attributes?: Record<string, any>;
    geometry?: {
        type: string;
        lod?: string;
        coordinates: number[][][];
    };
}

interface HttpFcbReader {
    meta(): Promise<any>;
    selectBbox(minX: number, minY: number, maxX: number, maxY: number, offset?: number, limit?: number): Promise<any>;
    cityjson(): Promise<any>;
    free(): void;
}

export class FlatCityBufLoader {
    texturesPath: string;
    scene: Group;
    matrix: Matrix4 | null;
    boundingBox: Box3 | null;
    parser: CityJSONWorkerParser;
    httpReader: HttpFcbReader | null;
    fcbUrl: string | null;
    maxFeatures: number;
    metadata: FcbMetadata | null;
    isInitialized: boolean;

    constructor(parser?: CityJSONWorkerParser);
    
    setTexturesPath(path: string): void;
    setMaxFeatures(max: number): void;
    
    initWasm(): Promise<any>;
    setUrl(url: string): Promise<void>;
    fetchMetadata(): Promise<FcbMetadata>;
    
    loadBbox(minX: number, minY: number, maxX: number, maxY: number, minZ?: number, maxZ?: number): Promise<Group>;
    fetchCityJSON(minX: number, minY: number, maxX: number, maxY: number, minZ: number, maxZ: number): Promise<any>;
    fetchFeatures(minX: number, minY: number, maxX: number, maxY: number, minZ: number, maxZ: number): Promise<FcbFeature[]>;
    fetchFeaturesFromIterator(iterator: any): Promise<FcbFeature[]>;
    
    convertToCityJSON(features: FcbFeature[]): any;
    convertGeometry(geometry: any, vertices: number[][], startIndex: number): any;
    mapToJson(obj: any): any;
    
    computeMatrix(data: any): void;
    getBoundingBox(): Box3;
    clear(): void;
    dispose(): void;
}