import {
	CityJSONLoader,
	ObjectTypeParser
} from '../src/index';
import {
	AmbientLight,
	DirectionalLight,
	PerspectiveCamera,
	Raycaster,
	Scene,
	sRGBEncoding,
	Vector2,
	WebGLRenderer
} from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

let scene, renderer, camera, controls, stats, raycaster;
let citymodel;

init();
render();

function init() {

	scene = new Scene();

	renderer = new WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0x1c1c1c );
	renderer.outputEncoding = sRGBEncoding;

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
	controls.screenSpacePanning = false;
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;

	raycaster = new Raycaster();

	renderer.domElement.addEventListener( 'dblclick', onMouseUp, false );

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
		let vCount = 0;

		scene.traverse( c => {

			if ( c.geometry ) {

				objCount ++;
				memCount += BufferGeometryUtils.estimateBytesUsed( c.geometry );
				const attr = c.geometry.getAttribute( "type" );
				vCount += attr.count;

			}

			statsContainer.innerHTML = `${ objCount } meshes (${ ( memCount / 1024 / 1024 ).toFixed( 2 ) } MB) - ${ vCount } vertices`;

		} );

	};

	const loader = new CityJSONLoader( parser );

	statsContainer.innerHTML = "Fetching...";

	fetch( "/example/data/montreal.json" )
		.then( res => {

			if ( res.ok ) {

				return res.json();

			}

		} )
		.then( data => {

			citymodel = data;

			loader.load( data );

			statsContainer.innerHTML = "Parsing...";

			scene.add( loader.scene );

		} );

}

function onMouseUp( e ) {

	const bounds = this.getBoundingClientRect();
	const mouse = new Vector2();
	mouse.x = e.clientX - bounds.x;
	mouse.y = e.clientY - bounds.y;
	mouse.x = ( mouse.x / bounds.width ) * 2 - 1;
	mouse.y = - ( mouse.y / bounds.height ) * 2 + 1;
	raycaster.setFromCamera( mouse, camera );

	const results = raycaster.intersectObject( scene, true );
	if ( results.length ) {

		const { face, object } = results[ 0 ];

		const objIds = object.geometry.getAttribute( 'objectid' );

		if ( objIds ) {

			const idx = objIds.getX( face.a );
			const objectId = Object.keys( citymodel.CityObjects )[ idx ];

			object.material.uniforms.highlightedObjId.value = idx;

			console.log( objectId );

		}

	} else {

		scene.traverse( c => {

			if ( c.material ) c.material.uniforms.highlightedObjId.value = - 1;

		} );

	}

}

function render() {

	requestAnimationFrame( render );

	controls.update();
	renderer.render( scene, camera );
	stats.update();

}
