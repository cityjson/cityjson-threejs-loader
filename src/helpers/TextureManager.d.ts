import { CityObjectsMaterial } from "../materials/CityObjectsMaterial";

export class TextureManager {
	constructor(citymodel: any);
	getMaterials( baseMaterial: any ): CityObjectsMaterial[];
	setTextureFromFile( file: any ): void;
}
