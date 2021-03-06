import {
	CityJSONLoader,
	ObjectMaterialParser
} from '../src/index';
import {
	AmbientLight,
	PerspectiveCamera,
	Scene,
	WebGLRenderer
} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import cityjson_data from './data/mt.json';

let scene, renderer, camera, controls;


init();

function init() {

	scene = new Scene();

	renderer = new WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0x1c1c1c );

	document.body.appendChild( renderer.domElement );

	camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.0001, 4000 );
	camera.position.set( 10, 10, 10 );
	camera.up.set( 0, 0, 1 );

	const ambientLight = new AmbientLight( 0xFFFFFF, 0.7 ); // soft white light
	scene.add( ambientLight );

	controls = new OrbitControls( camera, renderer.domElement );
	controls.screenSpacePanning = true;

	controls.addEventListener( 'change', render );

	const parser = new ObjectMaterialParser( 'defalut' );

	const loader = new CityJSONLoader( parser );
	loader.load( cityjson_data );

	scene.add( loader.scene );

	render();

}

function render() {

	renderer.render( scene, camera );

}
