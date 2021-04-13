export class ChunkParser {

    matrix : Matrix4;
    chunksize : number = 2000;
    objectColors: object;

    onchunkload : ( vertices: number[], objectids: number[], objecttypes: number[] ) => void

    parse ( data: object ) : void

}