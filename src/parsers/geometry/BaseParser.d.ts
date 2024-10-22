import { GeometryData } from "./GeometryData";

export class BaseParser {

    geomData : GeometryData

    constructor( json: Object, objectIds: Number[], objectColors: Object );

    clean() : void;

    /**
     * Retrieves the index of a CityObject from the CityJSON dataset based on its object ID.
     * 
     * @param objectId - The unique identifier of the CityObject in the CityJSON dataset.
     * 
     * @returns The index of the CityObject in the CityJSON dataset. If the object is not found,
     *                   the method returns `-1`.
     */
    getObjectIdx(objectId: string): number;

    /**
     * Retrieves the index of a CityObject type from the `objectColors` map based on the provided `cityObjectTypeName`.
     * 
     * If the CityObject type (`cityObjectTypeName`) exists in the `objectColors`, its index is returned.
     * If the type is not found, it is added to `this.objectColors` with a randomly generated color, 
     * and its index is returned.
     * 
     * @param cityObjectTypeName - The name of the CityObject type (e.g., "Building", "BuildingPart", "Bridge", etc.).
     *                                      This is used to search in `objectColors` and `this.objectColors`.
     * 
     * @returns The index of the CityObject type in the `objectColors`.
     *                   If the type is not found, it is assigned a random color and its index in `this.objectColors` 
     *                   is returned.
     */
    getObjectTypeIdx(cityObjectTypeName: string): number;

    /**
     * Retrieves the index of a surface type from the CityJSON semantics based on the provided surface index (`idx`).
     * 
     * The method checks if the `semantics` array is not empty, and if a valid surface is found at the index `idx`, 
     * it attempts to find the surface's type within the `this.surfaceColors` object. If the surface type is not present, 
     * it assigns a random color to that type and returns the new index.
     * 
     * @param idx - The index of the current surface, used to access the corresponding semantic value.
     *                       It refers to an index in the `semantics.values` array.
     * 
     * @param semantics - An array of surface indices that correspond to surfaces in the `surfaces` list.
     * 
     * @param surfaces - A list of surfaces, where each surface has properties like `type` (e.g., 
     *                                   "GroundSurface", "RoofSurface", etc.). Each element in `semantics` corresponds
     *                                   to a surface in this list.
     * 
     * @returns The index of the surface type in the `surfaceColors` object. If the surface type 
     *                   is not found, a new entry is added to `surfaceColors` with a randomly generated color, 
     *                   and its index is returned. If no valid surface is found, it returns `-1`.
     */
    getSurfaceTypeIdx(idx: number, semantics: number[], surfaces: { type: string, [key: string]: any }[]): number;

    /**
     * Parses the `geom` object
     * 
     * @param geom The geometry object representing a CityJSON geometry at a specific LoD
     * @param objectId The ID of the CityObject in the CityJSON having the `geom` object
     * @param geomIdx The index of the geometry in the geometry array of the CityObject
     */ 
    parse( geom: Object, objectId: String, geomIdx: Number ): void;

}