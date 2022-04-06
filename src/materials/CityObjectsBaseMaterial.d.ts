import { Color, Shader, ShaderMaterial } from "three";

/**
 * A base class for a material containing shader logic to render chunks of city
 * object data. This class, should never be used on its own, but only used to
 * derive specific classes.
 */
export class CityObjectsBaseMaterial extends ShaderMaterial {

    /**
     * Creates this material based on an existing shader (from `ShaderLib`).
     * 
     * @param shader The shader on top of which the material will be built.
     */
    constructor( shader : Shader );

    /**
     * Creates a table of colors based on a lookup color table.
     * 
     * @param colors The lookup table of colors
     * 
     * @example
     * const colors = {
     *     "Building": 0x0000ff
     * }
     * 
     * // Assuming a `material` already exists
     * material.uniforms.objectColors.value = material.createColorsArray( colors );
     */
    private createColorsArray( colors : Object ) : Color[];

    /**
     * The lookup table of object colors. When set, this will also update the
     * respective uniform of the shader.
     */
    objectColors : Object;

    /**
     * The lookup table of surface colors. When set, this will also update the
     * respective uniform of the shader.
     */
    surfaceColors : Object;

    /**
     * If set to `true` then semantic surface colors are used for individual
     * surfaces, based on the values from `surfaceColors`.
     */
    showSemantics : Boolean;

    /**
     * if set to `true` then an individual surface is highlighted, based on the
     * properties of `highlightedObject`
     */
    selectSurface : Boolean;

    /**
     * The LoD index to be rendered. This should be used in conjunction with
     * a lookup table based on which the `lodid` attributes of the geometry is
     * set. If set to `- 1`, then all LoDs are rendered.
     */
    showLod : Number;

    /**
     * The color to use for highlighting the selected object, as set by
     * `highlightedObject`.
     */
    highlightColor : Color;

    /**
     * The selected object to highlight. This is an object with properties:
     * 
     * @example
     * { objectIndex, geometryIndex, boundaryIndex }
     */
    highlightedObject : Object;

}