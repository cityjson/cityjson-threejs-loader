import {
	CityJSONLoader,
	CityJSONWorkerParser
} from '../src/index';
import {
	AmbientLight,
	Color,
	CylinderBufferGeometry,
	DirectionalLight,
	Group,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	Raycaster,
	Scene,
	SphereBufferGeometry,
	sRGBEncoding,
	Vector2,
	Vector3,
	WebGLRenderer
} from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'three/examples/jsm/libs/dat.gui.module.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

let scene, renderer, camera, controls, stats, raycaster;
let modelgroup;
let citymodel;
let parser;
let loader;
let statsContainer;
let infoContainer;
let colorOptions;
let semanticOptions;
let objectOptions;
let marker;

let params = {

	'showOnlyGeometry': - 1,
	'showSemantics': true,
	'highlightColor': '#FFC107',
	'backgroundColor': '#1c1c1c',
	'ambientIntensity': 0.7,
	'directionalIntensity': 1

};

init();
render();

function init() {

	scene = new Scene();

	renderer = new WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( params.backgroundColor );
	renderer.outputEncoding = sRGBEncoding;

	document.body.appendChild( renderer.domElement );

	camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.0001, 4000 );
	camera.position.set( 1, 1, 1 );
	camera.up.set( 0, 0, 1 );

	const ambientLight = new AmbientLight( 0x666666, params.ambientIntensity ); // soft white light
	scene.add( ambientLight );

	// lights
	const dirLight = new DirectionalLight( 0xffffff, params.directionalIntensity );
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
	renderer.domElement.addEventListener( 'mousemove', onMouseMove, false );

	const mat = new MeshBasicMaterial( { color: 0xe91e64 } );
	marker = new Mesh( new SphereBufferGeometry( 0.001 ), mat );
	scene.add( marker );
	marker.visible = false;

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

	// GUI
	const gui = new dat.GUI();
	gui.width = 300;

	const visualOptions = gui.addFolder( 'Visual Options' );
	visualOptions.add( params, 'showSemantics' );
	visualOptions.add( params, 'showOnlyGeometry' ).min( - 1 ).max( 10 ).step( 1 );
	visualOptions.open();

	colorOptions = gui.addFolder( 'Colors' );
	colorOptions.addColor( params, 'backgroundColor' ).onChange( v => {

		renderer.setClearColor( v );

	} );
	colorOptions.addColor( params, 'highlightColor' );
	colorOptions.open();

	semanticOptions = colorOptions.addFolder( 'Semantics' );

	objectOptions = colorOptions.addFolder( 'City Objects' );

	const lightingOptions = gui.addFolder( 'Lights' );

	lightingOptions.add( params, "ambientIntensity" ).min( 0 ).max( 1 ).step( 0.1 ).onChange( ( v ) => {

		ambientLight.intensity = v;

	} );

	lightingOptions.add( params, "directionalIntensity" ).min( 0 ).max( 1 ).step( 0.1 ).onChange( ( v ) => {

		dirLight.intensity = v;

	} );


	gui.open();

	stats = new Stats();
	stats.showPanel( 0 );
	document.body.appendChild( stats.dom );

	parser = new CityJSONWorkerParser();
	parser.chunkSize = 2000;
	parser.onChunkLoad = () => {

		let objCount = 0;
		let memCount = 0;
		let vCount = 0;

		modelgroup.traverse( c => {

			if ( c.geometry ) {

				objCount ++;
				memCount += BufferGeometryUtils.estimateBytesUsed( c.geometry );
				const attr = c.geometry.getAttribute( "type" );
				vCount += attr.count;

			}

			statsContainer.innerHTML = `${ objCount } meshes (${ ( memCount / 1024 / 1024 ).toFixed( 2 ) } MB) - ${ vCount } vertices`;

		} );

		for ( const surface in parser.surfaceColors ) {

			const exists = Object.keys( params ).indexOf( surface ) > - 1;

			params[ surface ] = '#' + parser.surfaceColors[ surface ].toString( 16 ).padStart( 6, '0' );

			if ( ! exists ) {

				semanticOptions.addColor( params, surface ).onChange( () => {

					modelgroup.traverse( c => {

						if ( c.material ) {

							c.material.uniforms.showSemantics.value = params.showSemantics;
							c.material.uniforms.showGeometry.value = params.showOnlyGeometry;
							c.material.uniforms.highlightColor.value.setHex( params.highlightColor.replace( '#', '0x' ) );

							for ( const surface in params ) {

								const idx = Object.keys( parser.surfaceColors ).indexOf( surface );
								if ( idx > - 1 ) {

									const col = new Color();
									col.setHex( params[ surface ].replace( '#', '0x' ) );
									c.material.uniforms.surfaceColors.value[ idx ] = col;

								}

							}

						}

					} );

				} );

			}

		}

		for ( const objtype in parser.objectColors ) {

			const exists = Object.keys( params ).indexOf( objtype ) > - 1;

			params[ objtype ] = '#' + parser.objectColors[ objtype ].toString( 16 ).padStart( 6, '0' );

			if ( ! exists ) {

				objectOptions.addColor( params, objtype ).onChange( () => {

					modelgroup.traverse( c => {

						if ( c.material ) {

							for ( const objtype in params ) {

								const idx = Object.keys( parser.objectColors ).indexOf( objtype );
								if ( idx > - 1 ) {

									const col = new Color();
									col.setHex( params[ objtype ].replace( '#', '0x' ) );
									c.material.uniforms.objectColors.value[ idx ] = col;

								}

							}

						}

					} );

				} );

			}

		}

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

function onMouseMove( e ) {

	if ( ! e.ctrlKey ) {

		return;

	}

	const bounds = this.getBoundingClientRect();
	const mouse = new Vector2();
	mouse.x = e.clientX - bounds.x;
	mouse.y = e.clientY - bounds.y;
	mouse.x = ( mouse.x / bounds.width ) * 2 - 1;
	mouse.y = - ( mouse.y / bounds.height ) * 2 + 1;
	raycaster.setFromCamera( mouse, camera );

	const results = raycaster.intersectObject( modelgroup, true );
	if ( results.length ) {

		const { face, point, object } = results[ 0 ];

		let closestPoint = null;

		// Snap to closest point
		const position = object.geometry.getAttribute( 'position' );
		const m = object.matrixWorld;
		const points = [
			new Vector3( position.getX( face.a ), position.getY( face.a ), position.getZ( face.a ) ).applyMatrix4( m ),
			new Vector3( position.getX( face.b ), position.getY( face.b ), position.getZ( face.b ) ).applyMatrix4( m ),
			new Vector3( position.getX( face.c ), position.getY( face.c ), position.getZ( face.c ) ).applyMatrix4( m )
		];
		let dist = point.distanceTo( points[ 0 ] );
		closestPoint = points[ 0 ];
		for ( let i = 0; i < 3; i ++ ) {

			const newDist = point.distanceTo( points[ i ] );
			if ( newDist < dist ) {

				closestPoint = points[ i ];
				dist = newDist;

			}

		}

		if ( closestPoint === null ) {

			closestPoint = point;

		}

		// Compute and show a marker at the intersection point
		marker.position.copy( closestPoint );
		const normal = face.normal;
		normal.transformDirection( object.matrixWorld );
		marker.lookAt(
			closestPoint.x + normal.x,
			closestPoint.y + normal.y,
			closestPoint.z + normal.z
		);

		marker.visible = true;

		const mm = new Matrix4();
		mm.copy( parser.matrix );
		mm.invert();

		closestPoint.applyMatrix4( mm );

		let str = `${ Math.round( closestPoint.x * 1000 ) / 1000 }, ${ Math.round( closestPoint.y * 1000 ) / 1000 }, ${ Math.round( closestPoint.z * 1000 ) / 1000 }`;

		infoContainer.innerHTML = str;

	}

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

				modelgroup.add( loader.scene );

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

	modelgroup.traverse( c => {

		if ( c.material ) c.material.uniforms.highlightedObjId.value = - 1;

	} );

	infoContainer.innerHTML = "";

	const results = raycaster.intersectObject( modelgroup, true );
	if ( results.length ) {

		const { face, object } = results[ 0 ];

		const objIds = object.geometry.getAttribute( 'objectid' );
		const semIds = object.geometry.getAttribute( 'surfacetype' );

		if ( objIds ) {

			const idx = objIds.getX( face.a );
			const objectId = Object.keys( citymodel.CityObjects )[ idx ];

			const geomId = object.geometry.getAttribute( 'geometryid' ).getX( face.a );
			const boundId = object.geometry.getAttribute( 'boundaryid' ).getX( face.a );

			const data = Object.assign( {}, citymodel.CityObjects[ objectId ] );
			delete data.geometry;

			const semId = semIds.getX( face.a );

			let str = `<b>${ data.type }${ semId >= 0 ? ' - ' + Object.keys( parser.surfaceColors )[ semId ] : '' }</b>`;
			str += `<br/>Geometry: ${ geomId } / Surface: ${ boundId }`;
			if ( data.attributes ) {

				Object.keys( data.attributes ).map( k => {

					str += `<br/>${ k }: ${ data.attributes[ k ] }`;

				} );

			}

			if ( data.parents ) {

				Object.values( data.parents ).map( parentID => {

					str += '<br/><b> Parent attributes</b>';

					const parentObject = Object.assign( {}, citymodel.CityObjects[ parentID ] );
					delete parentObject.geometry;

					if ( parentObject.attributes ) {

						console.log( parentObject.attributes );

						Object.keys( parentObject.attributes ).map( k => {

							str += `<br/>${ k }: ${ parentObject.attributes[ k ] }`;

						} );

					}

				} );

			}

			infoContainer.innerHTML = str;

			object.material.uniforms.highlightedObjId.value = idx;
			object.material.uniforms.highlightedGeomId.value = geomId;
			object.material.uniforms.highlightedBoundId.value = boundId;

			object.material.uniforms.selectSurface.value = e.ctrlKey;

		}

	}

}

function render() {

	requestAnimationFrame( render );

	scene.traverse( c => {

		if ( c.material ) {

			if ( c.material instanceof MeshBasicMaterial ) {

				return;

			}

			c.material.uniforms.showSemantics.value = params.showSemantics;
			c.material.uniforms.showGeometry.value = params.showOnlyGeometry;
			c.material.uniforms.highlightColor.value.setHex( params.highlightColor.replace( '#', '0x' ) );

		}

	} );

	controls.update();
	renderer.render( scene, camera );
	stats.update();

}
