import { Texture, ShaderLib, RepeatWrapping, TextureLoader, SRGBColorSpace } from "three";
import { CityObjectsMaterial } from "../materials/CityObjectsMaterial";

export class TextureManager {

	constructor( citymodel ) {

		if ( citymodel.appearance && citymodel.appearance.textures ) {

			this.cityTextures = citymodel.appearance.textures;

		} else {

			this.cityTextures = [];

		}

		this.textures = [];
		this.materials = [];

		this.needsUpdate = false;
		this.onChange = null;

		this.loadFromUrl();

	}

	get totalTextures() {

		return this.cityTextures.length;

	}

	get resolvedTextures() {

		return this.textures.filter( t => t ).length;

	}

	getMaterials( baseMaterial ) {

		if ( this.materials.length === 0 || this.needsUpdate ) {

			const materials = [];

			for ( let i = 0; i < this.cityTextures.length; i ++ ) {

				if ( this.textures[ i ] ) {

					const mat = new CityObjectsMaterial( ShaderLib.lambert, {
						objectColors: baseMaterial.objectColors,
						surfaceColors: baseMaterial.surfaceColors,
						transparent: true
					} );

					mat.uniforms.cityTexture.value = this.textures[ i ];
					mat.needsUpdate = true;

					materials.push( mat );

				} else {

					materials.push( baseMaterial );

				}

			}

			for ( const mat of this.materials ) {

				if ( mat !== baseMaterial ) {

					mat.dispose();

				}

			}

			this.materials = materials;

			this.needsUpdate = false;

		}

		return [ ...this.materials, baseMaterial ];

	}

	setTextureFromUrl( i, url ) {

		const context = this;

		new TextureLoader().load( url, ( tex => {

			tex.encoding = SRGBColorSpace;
			tex.wrapS = RepeatWrapping;
			tex.wrapT = RepeatWrapping;

			context.textures[ i ] = tex;

			this.needsUpdate = true;
			if ( this.onChange ) {

				this.onChange();

			}

		} ) );

	}

	loadFromUrl() {

		this.textures = [];

		for ( const [ i, texture ] of this.cityTextures.entries() ) {

			this.setTextureFromUrl( i, texture.image );

		}

	}

	setTextureFromFile( file ) {

		const context = this;

		for ( const [ i, texture ] of this.cityTextures.entries() ) {

			if ( texture.image.includes( file.name ) ) {

				const reader = new FileReader();

				reader.onload = event => {

					const img = new Image();

					img.onload = evt => {

						const tex = new Texture( evt.target );

						tex.encoding = SRGBColorSpace;
						tex.wrapS = RepeatWrapping;
						tex.wrapT = RepeatWrapping;
						tex.needsUpdate = true;

						context.textures[ i ] = tex;

						this.needsUpdate = true;
						if ( this.onChange ) {

							this.onChange();

						}

					};

					img.src = event.target.result;

				};

				reader.readAsDataURL( file );

			}

		}

	}

}
