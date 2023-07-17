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

				const scaleX = 1 / ( 2 * 20037508.34 );
				const scaleY = 1 / ( 2 * 20037508.34 );
				const translateX = 0.5;
				const translateY = 0.5;

				const matrix = new Matrix4();
				// loader.matrix = matrix.set( 1, 0, 0, translateX, 0, - 1, 0, translateY, 0, 0, 1, 0, 0, 0, 0, 1 ).scale( new Vector3( scaleX, scaleY, scaleX ) );

				loader.load( cm );

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
		center: [ 0, 0 ], // starting position [lng, lat]
		zoom: 0 // starting zoom
	} );

	window.map = map;
	window.proj4 = proj4;

	// setup CityJSON loader
	parser = new CityJSONWorkerParser();
	parser.chunkSize = 2000;
	parser.onChunkLoad = () => {

		loader.scene.traverse( c => c.material = new MeshLambertMaterial( { color: 0xff0000 } ) );
		console.log( "Loaded chunk" );

	};

	parser.onComplete = () => {

		const geom = loader.scene.children[ 0 ].geometry;
		geom.computeBoundingSphere();
		const center = geom.boundingSphere.center;
		// bbox.applyMatrix4( loader.matrix );
		console.log( loader.matrix );
		console.log( center );

		scene.add( loader.scene );

		const scale = 1 / ( 2 * 20037508.34 );
		const translateX = 0.5;
		const translateY = 0.5;

		const matrix = new Matrix4();
		matrix.set( scale, 0, 0, translateX, 0, - scale, 0, translateY, 0, 0, scale, 0, 0, 0, 0, 1 );

		const fullMatrix = loader.matrix.clone();
		fullMatrix.invert();
		fullMatrix.multiplyMatrices( matrix, fullMatrix );

		center.applyMatrix4( fullMatrix );

		const googleCoords = new maplibre.MercatorCoordinate( center.x, center.y );
		const wgsCoords = googleCoords.toLngLat();
		console.log( `WGS: ${wgsCoords}` );
		console.log( `Mercator: ${center}` );

		map.easeTo( { center: wgsCoords, zoom: 16 } );

	};

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

			map = map;

			renderer = new WebGLRenderer( {
				canvas: map.getCanvas(),
				context: gl,
				antialias: true
			} );

			renderer.autoClear = false;

		},
		render: function ( gl, matrix ) {

			const m = new Matrix4().fromArray( matrix );

			const scale = 1 / ( 2 * 20037508.34 );
			const translateX = 0.5;
			const translateY = 0.5;

			const toMercator = new Matrix4();
			toMercator.set( scale, 0, 0, translateX, 0, - scale, 0, translateY, 0, 0, scale, 0, 0, 0, 0, 1 );

			if ( loader.matrix ) {

				const fullMatrix = loader.matrix.clone();
				fullMatrix.invert();
				fullMatrix.multiplyMatrices( toMercator, fullMatrix );
				fullMatrix.multiplyMatrices( m, fullMatrix );

				camera.projectionMatrix = fullMatrix;

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
