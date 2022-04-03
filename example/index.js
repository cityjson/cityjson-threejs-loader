import {
	CityJSONLoader,
	CityJSONWorkerParser
} from '../src/index';
import {
	AmbientLight,
	Color,
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
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

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

	'showOnlyLod': - 1,
	'showSemantics': true,
	'highlightColor': '#FFC107',
	'backgroundColor': '#1c1c1c',
	'ambientIntensity': 0.7,
	'directionalIntensity': 1,
	'linePickingThreshold': 0.1,
	'linewidth': 0.001

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
	raycaster.params.Line.threshold = params.linePickingThreshold;
	raycaster.params.Points.threshold = params.linePickingThreshold;

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
	visualOptions.add( params, 'showOnlyLod' ).min( - 1 ).max( 10 ).step( 1 );
	visualOptions.add( params, 'linewidth' ).min( 0.001 ).max( 0.01 ).step( 0.001 ).onChange( ( v ) => {

		scene.traverse( m => {

			if ( m.material && m.material.linewidth ) {

				m.material.linewidth = v;

			}

		} );

	} );
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

			if ( parser.loading ) {

				statsContainer.innerHTML += " - Parsing...";

			}

		} );

		for ( const surface in parser.surfaceColors ) {

			const exists = Object.keys( params ).indexOf( surface ) > - 1;

			params[ surface ] = '#' + parser.surfaceColors[ surface ].toString( 16 ).padStart( 6, '0' );

			if ( ! exists ) {

				semanticOptions.addColor( params, surface ).onChange( () => {

					modelgroup.traverse( c => {

						if ( c.material && c.material.isCityObjectsMaterial ) {

							c.material.showSemantics = params.showSemantics;
							c.material.showLod = params.showOnlyLod;
							c.material.highlightColor = params.highlightColor;

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

		const { face, point, object, index } = results[ 0 ];

		let closestPoint = null;

		// Snap to closest point
		const position = object.geometry.getAttribute( 'position' );

		if ( face ) {

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

		} else {

			closestPoint = position[ index ];

		}

		if ( closestPoint === undefined ) {

			closestPoint = point;

		}

		// Compute and show a marker at the intersection point
		marker.position.copy( closestPoint );
		// const normal = face.normal;
		// normal.transformDirection( object.matrixWorld );
		// marker.lookAt(
		// 	closestPoint.x + normal.x,
		// 	closestPoint.y + normal.y,
		// 	closestPoint.z + normal.z
		// );

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

function getActiveResult( results ) {

	// Only pick a result as soon as its LoD is shown
	if ( params.showOnlyLod > - 1 ) {

		for ( let i = 0; i < results.length; i ++ ) {

			const { face, object, faceIndex } = results[ i ];

			const vertexIdx = face ? face.a : faceIndex * 2;

			const lodIdx = object.geometry.getAttribute( "lodid" ).getX( vertexIdx );

			if ( lodIdx == params.showOnlyLod || lodIdx == - 1 ) {

				return results[ i ];

			}

		}

	}

	return results[ 0 ];

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

		if ( c.material && c.material.isCityObjectsMaterial ) {

			c.material.highlightedObject = undefined;

		}

	} );

	infoContainer.innerHTML = "";

	const results = raycaster.intersectObject( modelgroup, true );
	if ( results.length ) {

		const result = getActiveResult( results );
		const object = result.object;

		const intersectionInfo = object.resolveIntersectionInfo( result, citymodel );

		if ( intersectionInfo ) {

			const data = Object.assign( {}, citymodel.CityObjects[ intersectionInfo.objectId ] );
			delete data.geometry;

			const semId = intersectionInfo.surfaceTypeIndex;

			let str = `<b>${ data.type }${ semId >= 0 ? ' - ' + Object.keys( parser.surfaceColors )[ semId ] : '' }</b>`;
			str += `<br/>Geometry: ${ intersectionInfo.geometryIndex } / Surface: ${ intersectionInfo.boundaryIndex } / LoD: ${ parser.lods[ intersectionInfo.lodIndex ] }`;
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

			if ( object.material.isCityObjectsMaterial ) {

				object.material.highlightedObject = intersectionInfo;

				object.material.selectSurface = e.ctrlKey;

			}

		}

	}

}

function render() {

	requestAnimationFrame( render );

	raycaster.params.Line.threshold = params.linePickingThreshold;

	scene.traverse( c => {

		if ( c.material && c.material.isCityObjectsMaterial ) {

			c.material.showSemantics = params.showSemantics;
			c.material.showLod = params.showOnlyLod;
			c.material.highlightColor = params.highlightColor;

		}

	} );

	controls.update();
	renderer.render( scene, camera );
	stats.update();

}
