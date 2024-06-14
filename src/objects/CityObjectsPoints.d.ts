import { Material } from "three";
import { Matrix4, Mesh, Vector3 } from "three";
import { GeometryData } from "../parsers/geometry/GeometryData";

/**
 * This class is designed to wrap some logic for the creation of a point object
 * that contains `MultiPoints` CityJSON geometries, from `GeometryData`
 * extracted using a `PointParser`.
 * 
 * It also contains functions to retrieve info of the city model based on an
 * intersection.
 */
export class CityObjectsPoints extends Mesh {

    citymodel: Object;
    isCityObject: true;
    isCityObjectPoints: true;

    /**
     * Creates a CityObjectMesh from `GeometryData`
     * 
     * @param citymodel The CityJSON model
     * @param vertices The list of vertices for the mesh
     * @param geometryData The geometry data with all other information (objectIds etc.)
     * @param matrix A matrix to transform the mesh
     * @param material A material (preferably a `CityObjectsMaterial`)
     */
    constructor ( citymodel: Object, vertices: Vector3[], geometryData: GeometryData, matrix: Matrix4, material: Material );

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