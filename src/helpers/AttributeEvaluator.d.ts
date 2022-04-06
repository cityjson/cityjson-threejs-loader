/**
 * Class that evaluates a given attribute of a citymodel to identify unique
 * values.
 * 
 * This is mostly used for conditional formatting.
 * 
 * @example
 * const evaluator = new AttributeEvaluator( cityjsonData, 'roofType' );
 * 
 * evaluator.getUniqueValues() // This will return the unique values
 */
export class AttributeEvaluator {

    /**
     * Initializes the evaluator
     * 
     * @param citymodel The CityJSON object
     * @param attributeName The name of the attribute
     * @param includeNulls Whether nulls should be considered a unique value or not
     * @param checkParents Determines if cityobjects will take the attribute value from its parents
     * @param checkChildren Determines if cityobjects will take the attribute value from its children
     */
    constructor( citymodel : Object, attributeName : string, includeNulls? : Boolean, checkParents? : Boolean, checkChildren? : Boolean )

    /**
     * Returns all values found in the city model as an array. The array's
     * length equals the number of city objects and every value correspond to
     * the respective city object.
     */
    getAllValues() : []

    /**
     * Returns the unique values found in the city model
     */
    getUniqueValus() : []

    /**
     * Creates a color lookup table based on the unique values of the city model
     * which can be used for conditional formatting.
     */
    createColors() : {}

}