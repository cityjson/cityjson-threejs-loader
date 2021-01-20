import {
	CityJSONLoader
} from '../src/index';
import {
	PerspectiveCamera,
	Scene,
	WebGLRenderer
} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import cityjson_data from './data/3db_sub.json';

let scene, renderer, camera, controls;


init();

function init() {

	scene = new Scene();

	renderer = new WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );

	document.body.appendChild( renderer.domElement );

	camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 4000 );
	camera.position.set( 400, 400, 400 );

	controls = new OrbitControls( camera, renderer.domElement );
	controls.screenSpacePanning = true;

	controls.addEventListener( 'change', render );



	let loader = new CityJSONLoader();
	loader.load( cityjson_data );

}

function render() {

	renderer.render( scene, camera );

}