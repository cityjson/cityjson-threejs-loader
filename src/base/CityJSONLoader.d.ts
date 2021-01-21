import { Group, Matrix4 } from "three";

export class CityJSONLoader {

    scene: Group;
    matrix: Matrix4;
    
    load( data : Object ) : void;
    setTexturesPath( path: string ) : void;

}