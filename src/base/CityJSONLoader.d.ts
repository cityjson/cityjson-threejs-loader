import { Group, Matrix4, Box3 } from "three";
import { CityJSONWorkerParser } from "../parsers/CityJSONWorkerParser";
import { CityObjectParser } from "../parsers/CityObjectParser";
import { ObjectMaterialParser } from "../parsers/ObjectMaterialParser";

export class CityJSONLoader {

    scene: Group;
    matrix: Matrix4;
    boundingBox: Box3 | null;

    load( data : Object ) : void;
    setTexturesPath( path: string ) : void;
    constructor(parser: CityJSONWorkerParser | CityObjectParser | ObjectMaterialParser);
}