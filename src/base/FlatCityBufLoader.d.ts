import { Group, Matrix4, Box3 } from "three";
import { CityJSONWorkerParser } from "../parsers/CityJSONWorkerParser";

export class FlatCityBufLoader {
  texturesPath: string;
  scene: Group;
  matrix: Matrix4 | null;
  boundingBox: Box3 | null;
  parser: CityJSONWorkerParser;
  httpReader: any | null;
  fcbUrl: string | null;
  maxFeatures: number;
  metadata: any | null;
  header: any | null;
  isInitialized: boolean;

  // Private properties
  private _httpReader: any | null;
  private _wasmModule: any | null;
  private _wasmInitialized: boolean;
  private _cjseqInitialized: boolean;
  private _cjseq: any | null;

  constructor(parser?: CityJSONWorkerParser);

  setTexturesPath(path: string): void;
  setMaxFeatures(max: number): void;

  initWasm(): Promise<any>;
  setUrl(url: string): Promise<void>;

  load(
    bbox?: { minX: number; minY: number; maxX: number; maxY: number } | null
  ): Promise<Group>;

  // Private methods
  private _fetchCityJSON(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ): Promise<any>;
  private _fetchFeatures(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ): Promise<any[]>;

  computeMatrix(data: any, scale?: boolean): void;

  static mapToJson(item: any): any;
}
