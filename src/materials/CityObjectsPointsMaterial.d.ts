import { CityObjectsBaseMaterial } from "./CityObjectsBaseMaterial";

/**
 * A material to be used for rendering point city object geometries.
 */
export class CityObjectsPointsMaterial extends CityObjectsBaseMaterial {

    /**
     * The size of the point
     */
    size : Number;

    /**
     * Sets whether the point will attenuate based on the depth of the view to
     * give a perspective feeling.
     */
    sizeAttenuation : Boolean;

}