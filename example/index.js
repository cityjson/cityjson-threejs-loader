import {
	CityJSONLoader,
	ObjectTypeParser
} from '../src/index';
import {
	AmbientLight,
	DirectionalLight,
	PerspectiveCamera,
	Scene,
	WebGLRenderer
} from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

let scene, renderer, camera, controls, stats;

init();

function init() {

	scene = new Scene();

	renderer = new WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0x1c1c1c );

	document.body.appendChild( renderer.domElement );

	camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.0001, 4000 );
	camera.position.set( 1, 1, 1 );
	camera.up.set( 0, 0, 1 );

	const ambientLight = new AmbientLight( 0x666666, 0.7 ); // soft white light
	scene.add( ambientLight );

	// lights
	const dirLight = new DirectionalLight( 0xffffff );
	dirLight.position.set( 1, 2, 3 );
	scene.add( dirLight );

	controls = new OrbitControls( camera, renderer.domElement );
	controls.screenSpacePanning = true;

	// controls.addEventListener( 'change', render );

	const statsContainer = document.createElement( 'div' );
	statsContainer.style.position = 'absolute';
	statsContainer.style.top = 0;
	statsContainer.style.left = 0;
	statsContainer.style.color = 'white';
	statsContainer.style.width = '100%';
	statsContainer.style.textAlign = 'center';
	statsContainer.style.padding = '5px';
	statsContainer.style.pointerEvents = 'none';
	statsContainer.style.lineHeight = '1.5em';
	document.body.appendChild( statsContainer );

	stats = new Stats();
	stats.showPanel( 0 );
	document.body.appendChild( stats.dom );

	const parser = new ObjectTypeParser();
	parser.chunkSize = 500;
	parser.on_load = () => {

		let objCount = 0;
		let memCount = 0;

		scene.traverse( c => {

			if ( c.geometry ) {

				objCount ++;
				memCount += BufferGeometryUtils.estimateBytesUsed( c.geometry );

			}

			statsContainer.innerHTML = `${ objCount } Meshes (${ ( memCount / 1024 / 1024 ).toFixed( 2 ) } MB)`;

		} );

	};

	const loader = new CityJSONLoader( parser );

	statsContainer.innerHTML = "Fetching...";

	render();

	fetch( "/example/data/montreal.json" )
		.then( res => {

			if ( res.ok ) {

				return res.json();

			}

		} )
		.then( data => {

			loader.load( data );

			statsContainer.innerHTML = "Parsing...";

			scene.add( loader.scene );

		} );

}

function render() {

	requestAnimationFrame( render );

	renderer.render( scene, camera );
	stats.update();

}
