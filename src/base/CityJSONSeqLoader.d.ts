import { CityJSONLoader } from "./CityJSONLoader";
import { CityJSONWorkerParser } from "../parsers/CityJSONWorkerParser";
import { CityJSONParser } from "../parsers/CityJSONParser";

export class CityJSONSeqLoader extends CityJSONLoader {
  load(data: string | Array<Object>): Promise<void>;
  parseCityJSONSeq(data: string): Array<Object>;
  loadFromURL(url: string): Promise<void>;
  constructor(parser: CityJSONWorkerParser | CityJSONParser);
}
