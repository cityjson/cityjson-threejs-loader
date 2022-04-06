# CityJSON three.js loader

A loader for [CityJSON](https://www.cityjson.org) files in `three.js`.

# Installation

## Use in your project

```
yarn install git+https://github.com/cityjson/cityjson-threejs-loader.git
```

## Development

- Clone this repository
- Run `yarn install`
- Go nuts!

### Run examples

- Run `yarn run dev`.
- Visit [http://localhost:9080/example/dev-bundle/index.html](http://localhost:9080/example/dev-bundle/index.html)
- Drag 'n' drop any file to visualise it.

# Use

You need to select one of the availables parsers (recommended is `CityJSONWorkerParser`) and use it with `CityJSONLoader`.

```JS
import { CityJSONLoader, CityJSONWorkerParser } from 'cityjson-threejs-loader'

// Initialise your scene here

const parser = CityJSONWorkerParser();

const loader = CityJSONLoader( parser );

loader.load( cityjsonData );

scene.add( loader.scene );
```

## Raycasting the scene

The added scene objects contain functions to retrieve information related to the original city model when raycasting:

```JS
// Initialise raycaster

const intersections = raycaster.intersectObject( loader.scene );

if ( intersection ) {

    // Gain the 3D object that was hit by the closest ray
    const object = intersection[ 0 ].object;

    // Check if this is a city object
    if ( object.isCityObject ) {

        const data = object.resolveIntersectionInfo( intersection[ 0 ], cityjsonData )

        const objectId = data.objectId; // This is the objectId of the city object hit by the ray

    }

}
```

## Visualization options

The scene objects have specialised materials to handle aspects of how the respective geometries are handled. For example:

```JS
// Traverse the scene for objects
scene.traverse( obj = > {

    // Check if this has a material and if this is a city object material
    if ( obj.material && obj.material.isCityObjectsMaterial ) {

        obj.material.showSemantics = false; // This will disable coloring per semantic surface

    }

} );
```

## Highlighting objects

City object materials can be used to highlight a specific object:

```JS
// Assuming cityjsonData contains the citymodel and we want to highlight the selectObjectId
const objectIndex = Object.keys( cityjsonData.CityObjects ).indexOf( selectedObjectId )

// Traverse the scene for objects
scene.traverse( obj = > {

    // Check if this has a material and if this is a city object material
    if ( obj.material && obj.material.isCityObjectsMaterial ) {

        // Set the highlighted object index to what was found before
        obj.highlightedObject = {

            objectIndex: objectIndex

        };

    }

} );
```