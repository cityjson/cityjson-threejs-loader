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
