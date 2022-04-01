import { GeometryData } from "./GeometryData";

export class BaseParser {

    geomData : GeometryData

    constructor( json: Object, objectIds: Number[], objectColors: Object );

    clean() : void;

    /**
     * Parses the `geom` object.
     */ 
    parse( geom: Object, objectId: String, geomIdx: Number ): void;

}