import { Material } from "three";
import { Matrix4, Mesh, Vector3 } from "three";
import { GeometryData } from "../parsers/geometry/GeometryData";

/**
 * This class is designed to wrap some logic for the creation of a mesh that 
 * contains polygonal CityJSON geometries derived from `GeometryInstance`,
 * 
 * It also contains functions to retrieve info of the city model based on an
 * intersection.
 */
export class CityObjectsInstancedMesh extends Mesh {

    citymodel: Object;
    isCityObject: true;
    isCityObjectMesh: true;
    supportsConditionalFormatting: true;
    supportsMaterials: true;

    /**
     * Creates a CityObjectMesh from `GeometryData`
     * 
     * @param citymodel The CityJSON model
     * @param vertices The list of vertices for the mesh
     * @param geometryData The geometry data with all other information (surfaceTypes etc.)
     * @param isntanceData The data of instanced (objectIds, objectTypes and geometryIds)
     * @param matrix A matrix to transform the mesh
     * @param material A material (preferably a `CityObjectsMaterial`)
     */
    constructor ( citymodel: Object, vertices: Vector3[], geometryData: GeometryData, instanceData: Object, matrix: Matrix4, material: Material );

    /**
     * Returns the index of one vertex that was close to the intersection as
     * computed by a `Raycaster`.
     *  
     * @param intersection The intersection (as returned from a `Raycaster`)
     */
    getIntersectionVertex( intersection: Object ) : Number;

    /**
     * Returns citymodel information for the given intersection. The result is
     * an object with the following information:
     * 
     * @example
     * { vertexIndex, objectIndex, objectId, geometryIndex, boundaryIndex, objectTypeIndex, surfaceTypeIndex, lodIndex }
     * 
     * @param intersection The intersection (as returned from a `Raycaster`)
     */
    resolveIntersectionInfo( intersection: Object ): Object;

}