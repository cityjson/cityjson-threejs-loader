import { Group, Matrix4 } from "three";

export class ObjectMaterialParser {

    materialTheme : string;
    
    constructor( materialTheme : string );
    parse( data : Object, scene : Group ) : void;

}