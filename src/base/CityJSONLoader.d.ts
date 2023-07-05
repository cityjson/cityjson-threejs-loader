import { Group, Matrix4, Box3 } from "three";
import { CityJSONWorkerParser } from "../parsers/CityJSONWorkerParser";
import { CityJSONParser } from "../parsers/CityJSONParser";

export class CityJSONLoader {

    scene: Group;
    matrix: Matrix4;
    boundingBox: Box3 | null;

    load( data : Object ) : void;
    setTexturesPath( path: string ) : void;
    constructor(parser: CityJSONWorkerParser | CityJSONParser);
}