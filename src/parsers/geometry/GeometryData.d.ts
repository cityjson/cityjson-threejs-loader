// Geometry types
export const POINTS = 0;
export const LINES = 1;
export const TRIANGLES = 2;

export class GeometryData {

    /**
     * The geometry type, which can be `POINTS`, `LINES` or `TRIANGLES`.
     */
    geometryType : Number;

    /**
     * Array of vertex indices corresponding to the vertices in the CityJSON `vertices` array. 
     */
    vertexIds: Number[];
    /**
     * Array of CityObject indices. Each entry corresponds to a CityObject that the vertices are associated with.
     */
    objectIds: Number[];
    /**
     * Array of CityObject type indices. Each entry corresponds to the type of the CityObject (e.g., "Building", "Bridge"),
     * which is indexed from the `defaultObjectColors` or `parser.objectColors`.
     */
    objectTypes: Number[];
    /**
     * Array of surface type indices. Each entry represents the type of surface (e.g., "GroundSurface", "WallSurface")
     * that a vertex belongs to. The index corresponds to entries in the `surfaceColors` or `defaultSemanticsColors` object.
     */
    semanticSurfaces: Number[];
    /**
     * Array of geometry indices. Each entry refers to the index of a geometry in the CityObject's `geometry` array, 
     * representing which geometric representation the vertex is part of.
     */
    geometryIds: Number[];
    /**
     * Array of boundary indices. Each entry refers to a boundary or shell in the geometry structure, representing 
     * which boundary a vertex belongs to.
     */
    boundaryIds: Number[];
    /**
     * Array of Level of Detail (LoD) indices. Each entry corresponds to a LoD level associated with the vertex, 
     * indicating which LoD geometry representation the vertex is part of.
     */
    lodIds: Number[];

	constructor(geometryType: number);

    /**
     * Adds a vertex with the given data
     * @param vertexId The index of the vertex in the CityJSON `vertices` array.
     * @param objectId The index of the CityObject this vertex belongs to.
     * @param objectType  The type of the CityObject (e.g., "Building", "Bridge") as indexed in the `defaultObjectColors` or `parser.objectColors` array.
     * @param surfaceType The index of the surface type in the `surfaceColors` object. Check `defaultSemanticsColors` for example.
     * @param geometryIdx The index of the geometry in the CityObject's `geometry` array.
     * @param boundaryIdx The index of the boundary or shell that this vertex belongs to within the geometry structure.
     * @param lodIdx The Level of Detail (LoD) index that defines which LoD this vertex is associated with.
     */
    addVertex( vertexId: Number, objectId: Number, objectType: Number, surfaceType: Number, geometryIdx: Number, boundaryIdx: Number, lodIdx: Number ) : void

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

    /**
     * Sets all objectIds to a specific value.
     * 
     * @param objectId The objectId to set for all vertices
     */
    setObjectId( objectId : Number ) : void

    /**
     * Sets all objectTypes to a specific value.
     * 
     * @param objectType The objectType to set for all vertices
     */
     setObjectType( objectType : Number ) : void

     /**
     * Sets all geometry indexes to a specific value.
     * 
     * @param geometryIdx The geometryId to set for all vertices
     */
    setGeometryIdx( geometryIdx : Number ) : void

}