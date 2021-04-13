import { Group, Matrix4 } from "three";

export class CityJSONWorkerParser {

    matrix: Matrix4;

    onChunkLoad : () => void;
    
    parse( data : Object, scene : Group ) : void;

}