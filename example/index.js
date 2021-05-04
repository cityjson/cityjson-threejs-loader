import {
	CityJSONLoader,
	CityJSONWorkerParser
} from '../src/index';
import {
	AmbientLight,
	DirectionalLight,
	Group,
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
let modelgroup;
let citymodel;
let parser;
let loader;
let statsContainer;
let infoContainer;

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

	modelgroup = new Group();
	scene.add( modelgroup );

	controls = new OrbitControls( camera, renderer.domElement );
	controls.screenSpacePanning = false;
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;

	raycaster = new Raycaster();

	renderer.domElement.addEventListener( 'dblclick', onDblClick, false );
	renderer.domElement.ondragover = ev => ev.preventDefault();
	renderer.domElement.ondrop = onDrop;

	// controls.addEventListener( 'change', render );

	statsContainer = document.createElement( 'div' );
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

	infoContainer = document.createElement( 'div' );
	infoContainer.style.position = 'absolute';
	infoContainer.style.bottom = 0;
	infoContainer.style.left = 0;
	infoContainer.style.color = 'white';
	infoContainer.style.width = '30%';
	infoContainer.style.maxHeight = '100%';
	infoContainer.style.textAlign = 'left';
	infoContainer.style.padding = '5px';
	infoContainer.style.pointerEvents = 'none';
	infoContainer.style.lineHeight = '1.5em';
	document.body.appendChild( infoContainer );

	stats = new Stats();
	stats.showPanel( 0 );
	document.body.appendChild( stats.dom );

	parser = new CityJSONWorkerParser();
	parser.chunkSize = 2000;
	parser.onChunkLoad = () => {

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

	loader = new CityJSONLoader( parser );

	statsContainer.innerHTML = "Fetching...";

	fetch( "/example/data/tetra.json" )
		.then( res => {

			if ( res.ok ) {

				return res.json();

			}

		} )
		.then( data => {

			citymodel = data;

			loader.load( data );

			statsContainer.innerHTML = "Parsing...";

			modelgroup.add( loader.scene );

		} );

}

function onDrop( e ) {

	e.preventDefault();

	if ( ! e.ctrlKey ) {

		while ( loader.scene.children.length > 0 ) {

			loader.scene.remove( loader.scene.children[ 0 ] );

		}

		loader.matrix = null;

	}

	for ( const item of e.dataTransfer.items ) {

		if ( item.kind === 'file' ) {

			statsContainer.innerHTML = "Oh, a file! Let me parse this...";

			const file = item.getAsFile();
			const reader = new FileReader();
			reader.readAsText( file, "UTF-8" );
			reader.onload = evt => {

				const cm = JSON.parse( evt.target.result );

				statsContainer.innerHTML = "Okay. Now I'll load it...";

				citymodel = cm;

				parser.resetMaterial();

				loader.load( cm );

				scene.add( loader.scene );

			};

		}

	}

}

function onDblClick( e ) {

	const bounds = this.getBoundingClientRect();
	const mouse = new Vector2();
	mouse.x = e.clientX - bounds.x;
	mouse.y = e.clientY - bounds.y;
	mouse.x = ( mouse.x / bounds.width ) * 2 - 1;
	mouse.y = - ( mouse.y / bounds.height ) * 2 + 1;
	raycaster.setFromCamera( mouse, camera );

	scene.traverse( c => {

		if ( c.material ) c.material.uniforms.highlightedObjId.value = - 1;

	} );

	infoContainer.innerHTML = "";

	const results = raycaster.intersectObject( scene, true );
	if ( results.length ) {

		const { face, object } = results[ 0 ];

		const objIds = object.geometry.getAttribute( 'objectid' );
		const semIds = object.geometry.getAttribute( 'surfacetype' );

		if ( objIds ) {

			const idx = objIds.getX( face.a );
			const objectId = Object.keys( citymodel.CityObjects )[ idx ];

			const data = Object.assign( {}, citymodel.CityObjects[ objectId ] );
			delete data.geometry;

			const semId = semIds.getX( face.a );

			let str = `<b>${ data.type }${ semId >= 0 ? ' - ' + Object.keys( parser.surfaceColors )[ semId ] : '' }</b>`;
			str += `<br/>Geometry: ${ object.geometry.getAttribute( 'geometryid' ).getX( face.a ) } / Surface: ${ object.geometry.getAttribute( 'boundaryid' ).getX( face.a ) }`;
			if ( data.attributes ) {

				Object.keys( data.attributes ).map( k => {

					str += `<br/>${ k }: ${ data.attributes[ k ] }`;

				} );

			}

			infoContainer.innerHTML = str;

			object.material.uniforms.highlightedObjId.value = idx;

		}

	}

}

function render() {

	requestAnimationFrame( render );

	controls.update();
	renderer.render( scene, camera );
	stats.update();

}
