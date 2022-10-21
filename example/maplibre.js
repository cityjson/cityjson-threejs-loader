import maplibre, { MapMouseEvent } from 'maplibre-gl';
import { AmbientLight, Camera,
		 DirectionalLight,
		 Matrix4,
		 MeshLambertMaterial,
		 Quaternion,
		 Scene,
		 Vector3,
		 WebGLRenderer } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import proj4 from 'proj4';
import { CityJSONWorkerParser, CityJSONLoader } from '../src/index';

let map;
let customLayer;

let citymodel;

let parser, loader;

let renderer, camera, scene;

let modelTransform;

function onDrop( e ) {

	e.preventDefault();

	for ( const item of e.dataTransfer.items ) {

		if ( item.kind === 'file' ) {

			const file = item.getAsFile();
			const reader = new FileReader();
			reader.readAsText( file, "UTF-8" );
			reader.onload = evt => {

				const cm = JSON.parse( evt.target.result );

				citymodel = cm;

				loader.load( cm );

				const bbox = loader.boundingBox.clone();
				bbox.applyMatrix4( loader.matrix );

				scene.add( loader.scene );

				fetch( "https://api.allorigins.win/get?url=https://epsg.org/api/v1/CoordRefSystem/7415/export?format=wkt&version=1" )
					.then( ( response ) => response.json().then( wkt => {

						try {

							proj4.defs( "EPSG:7415", "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.999908 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs +no_defs" );
							// console.log( wkt.contents );
							// proj4.defs( "EPSG:7415", wkt.contents );

							const originalCoords = [ - loader.matrix.elements[ 12 ], - loader.matrix.elements[ 13 ] ];
							const wgsCoords = proj4( "EPSG:7415", 'EPSG:4326', originalCoords );
							const googleCoords = maplibre.MercatorCoordinate.fromLngLat( wgsCoords, 0 );
							console.log( `Coords in 28992: ${originalCoords}` );
							console.log( `Coords in 4326: ${wgsCoords}` );
							console.log( `Coords in 3857: ${googleCoords.x}, ${googleCoords.y}` );


							// const coords = proj4( "EPSG:7415", 'EPSG:4326', [ - loader.matrix.elements[ 12 ] - 155, - loader.matrix.elements[ 13 ] - 65 ] );
							map.easeTo( { center: wgsCoords, zoom: 16 } );

							const modelAsMercatorCoordinate = maplibre.MercatorCoordinate.fromLngLat(
								wgsCoords,
								0
							);
							modelTransform = {
								translateX: modelAsMercatorCoordinate.x,
								translateY: modelAsMercatorCoordinate.y,
								translateZ: modelAsMercatorCoordinate.z,
								rotateX: 0,
								rotateY: 0,
								rotateZ: 0,
								/* Since our 3D model is in real world meters, a scale transform needs to be
								* applied since the CustomLayerInterface expects units in MercatorCoordinates.
								*/
								scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
							};

						} catch ( exp ) {

							console.log( exp );

						}

					} ) );

			};

		}

	}

}

function init() {

	const mapElement = window.document.getElementById( "map" );
	mapElement.ondragover = e => e.preventDefault();
	mapElement.ondrop = onDrop;

	fetch( "https://epsg.io/27700.wkt" )
		.then( ( response ) => response.text().then( wkt => {

			try {

				const coords = proj4( wkt, [ 51.73, - 1.09 ] );
				console.log( coords );

			} catch ( exp ) {

				console.log( exp );

			}

		} ) );

	map = new maplibre.Map( {
		container: 'map',
		style: 'https://api.maptiler.com/maps/basic/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL', //'https://demotiles.maplibre.org/style.json', // stylesheet location
		center: [ - 74.5, 40 ], // starting position [lng, lat]
		zoom: 9 // starting zoom
	} );

	window.map = map;
	window.proj4 = proj4;

	// setup CityJSON loader
	parser = new CityJSONWorkerParser();
	parser.chunkSize = 2000;
	parser.onChunkLoad = () => {

		loader.scene.traverse( c => c.material = new MeshLambertMaterial( { color: 0xffffff } ) );
		console.log( "Loaded chunk" );

	};
	// parser.onComplete = chunkUpdate;

	loader = new CityJSONLoader( parser );

	customLayer = {
		id: 'city-model',
		type: 'custom',
		renderingMode: '3d',
		onAdd: ( map, gl ) => {

			camera = new Camera();
			scene = new Scene();

			// create two three.js lights to illuminate the model
			// const directionalLight = new DirectionalLight( 0xffffff );
			// directionalLight.position.set( 0, - 70, 100 ).normalize();
			// scene.add( directionalLight );

			// const directionalLight2 = new DirectionalLight( 0xffffff );
			// directionalLight2.position.set( 0, 70, 100 ).normalize();
			// scene.add( directionalLight2 );

			const ambientLight = new AmbientLight( 0x666666, 0.7 ); // soft white light
			scene.add( ambientLight );

			// lights
			const dirLight = new DirectionalLight( 0xffffff, 1 );
			dirLight.position.set( 1, 2, 3 );
			scene.add( dirLight );

			// use the three.js GLTF loader to add the 3D model to the three.js scene
			// const gltfLoader = new GLTFLoader();
			// gltfLoader.load(
			// 	'https://maplibre.org/maplibre-gl-js-docs/assets/34M_17/34M_17.gltf',
			// 	function ( gltf ) {

			// 		scene.add( gltf.scene );

			// 	}
			// );
			map = map;

			renderer = new WebGLRenderer( {
				canvas: map.getCanvas(),
				context: gl,
				antialias: true
			} );

			renderer.autoClear = false;

		},
		render: function ( gl, matrix ) {

			// proj4('EPSG:3857', matrix[])

			const outMatrix = new Matrix4();
			outMatrix.set( ... matrix );

			if ( modelTransform ) {

				const rotationX = new Matrix4().makeRotationAxis(
					new Vector3( 1, 0, 0 ),
					modelTransform.rotateX
				);
				const rotationY = new Matrix4().makeRotationAxis(

					new Vector3( 0, 1, 0 ),
					modelTransform.rotateY

				);
				const rotationZ = new Matrix4().makeRotationAxis(
					new Vector3( 0, 0, 1 ),
					modelTransform.rotateZ
				);

				const m = new Matrix4().fromArray( matrix );
				const l = new Matrix4()
					.makeTranslation(
						modelTransform.translateX,
						modelTransform.translateY,
						modelTransform.translateZ
					)
					.scale(
						new Vector3(
							modelTransform.scale,
							- modelTransform.scale,
							modelTransform.scale
						)
					)
					.multiply( rotationX )
					.multiply( rotationY )
					.multiply( rotationZ );

				camera.projectionMatrix = m.multiply( l );

			} else {

				const p = new Vector3();
				const q = new Quaternion();
				const s = new Vector3();

				outMatrix.decompose( p, q, s );

				camera.projectionMatrix = new Matrix4().compose( new Vector3(), q, new Vector3( 0.01, - 0.01, 0.01 ) );

			}

			renderer.state.reset();
			renderer.render( scene, camera );
			map.triggerRepaint();

		}
	};

	map.on( 'style.load', () => {

		map.addLayer( customLayer );
		console.log( "Loaded" );

	} );

}

init();
