import { Group, Matrix4 } from "three";

/**
 * A parser that uses a WebWorker to parse chunks of CityJSON on the background.
 */
export class CityJSONWorkerParser {

    /**
     * Matrix that transforms object in 3D. This is used to move big coordinates
     * close to the origin and maintain relative position between different
     * citymodels.
     */
    matrix: Matrix4;

    /**
     * The size of chunks of city objects that are parsed as one mesh. Every
     * time a chunk is finished parsing, the respective mesh is added to the
     * scene.
     */
    chunkSize: Number;

    /**
     * Shows the state of loading, i.e. if there are more chunks to be parsed.
     */
    loading: Boolean;

    /**
     * The lookup of LoDs for this parser. It can be used to identify the LoD
     * of a vertex based on its `lodid` attributes. This variable will be filled
     * as the parsing proceeds with as many LoDs are occured in a file.
     */
    lods: Number[];

    /**
     * Callback for when a chunk is finished loading
     */
    onChunkLoad : () => void;

    /**
     * Callback for when the parsing of all chunks is finished
     */
    onComplete: () => void;
    
    /**
     * Parses a CityJSON file (`data`) and adds it to the `scene`.
     */
    parse( data : Object, scene : Group ) : void;

}