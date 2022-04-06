// Geometry types
export const POINTS = 0;
export const LINES = 1;
export const TRIANGLES = 2;

export class GeometryData {

    /**
     * The geometry type, which can be `POINTS`, `LINES` or `TRIANGLES`.
     */
    geometryType : Number;

    vertexIds: Number[];
    objectIds: Number[];
    objectTypes: Number[];
    semanticSurfaces: Number[];
    geometryIds: Number[];
    boundaryIds: Number[];
    lodIds: Number[];

	constructor( geometryType )

    /**
     * Adds a vertex with the given data
     */
    addVertex( vertexId, objectId, objectType, surfaceType, geometryIdx, boundaryIdx, lodIdx ) : void

    /**
     * Returns the number of vertices
     */
    count() : Number

    /**
     * Returns the dereferenced vertices, meaning that the actual coordinates as
     * derived from looking up `vertexList` based on `vertexIds` are returned.
     * 
     * @param vertexList The vertex list of coordinates to look up.
     */
    getVertices( vertexList: Number[][] ) : Number[];

    /**
     * Returns the data in an object format (for serialization).
     */
    toObject() : Object;

}