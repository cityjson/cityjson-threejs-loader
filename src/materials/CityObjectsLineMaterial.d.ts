import { CityObjectsBaseMaterial } from "./CityObjectsBaseMaterial";

/**
 * A material to be used for rendering linear city object geometries.
 */
export class CityObjectsLineMaterial extends CityObjectsBaseMaterial {

    /**
     * The width of the lines.
     */
    linewidth : number;

    /**
     * Defines if world or screen units should be used.
     */
    worldUnits : boolean;

}