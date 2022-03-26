import { Matrix4 } from 'three';

/**
 * A parser that parses a CityJSON model in chunks.
 */
export class ChunkParser {

    matrix : Matrix4;
    chunksize : Number;
    objectColors: Object;

    onchunkload : ( vertices: Number[], objectids: Number[], objecttypes: Number[] ) => void

    parse ( data: Object ) : void

}