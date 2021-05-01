import 'leaflet/dist/leaflet.css';

// import { censusRace } from "../data/ReferenceData.js";
import { ScaleQuantile, scaleQuantile } from 'd3-scale';
import { GeoJsonObject } from 'geojson';
import React, { createRef, useEffect, useState } from 'react';
import { GeoJSON, Map, Popup, TileLayer, ZoomControl } from 'react-leaflet';

import { Feature, Polygon, polygon, Properties } from '@turf/turf';

import US_counties from '../data/US_counties_5m.json';
import {
    addData, coordsToJSON, createRequest, fetchCensusData, getIntersect
} from '../helpers/Helpers';
import { attribution, colorRange, defaultMapState, tileUrl } from '../utils/Utils';
// import DemoMapTooltip from "./DemoMapTooltip";
 import DataContainer from './DataContainer';
// import US_tracts from "../data/";
// import Legend from './Legend';


interface MapReference {
  current: any; // FIXME this should not by any type
}

interface PolysOnMap {
  geometry: {
    coordinates: [number, number][];
    type: string;
  }
  properties: {
    CENSUSAREA: number
    COUNTY: string;
    GEO_ID: string;
    LSAD:   string;
    NAME:   string;
    STATE:  string;
    dataValue: {
      [key: string]: number;
    }
  }
}
interface QueryType {
  [key: string]: {
    name: string;
    type: string;
  }
}

const TitleBlock = ({ title }: {title: string}) => <div className="info title">{title}</div>;

//need to deal w negative values in data
const DemoMap = ({selectedVar}: {'selectedVar': string | null}) => {
	const testing = false;

	const [isLoaded, setIsLoaded] = useState<boolean>();
	const [items, setItems] = useState<Feature<Polygon, Properties>[]>([]);
  // 'variables' refers to the demographic query (third form option)
	const [variables, setVariables] = useState<QueryType>({'noData':{name: '', type: 'int'}});
	const [mapVariable, setMapVariable] = useState<string>('');
	const [groupInfo, setGroupInfo] = useState({vintage: 0, description: '', code: ''});
	const [colorScale, setColorScale] = useState<ScaleQuantile<string, never>>(); /// colorScale should have function type. It's an instance of scaleQuantile
	const [quantiles, setQuantiles] = useState<number[]>();
	const [onScreen, setOnScreen] = useState<Feature<Polygon, Properties>[]>();

	const mapRef: MapReference = createRef();
	const layerRef = createRef<GeoJSON>();

	const handleMove = () => {
		const map = mapRef.current.leafletElement;
		// const dataLayer = this.layerRef.current.leafletElement
		// dataLayer.clearLayers()
		const bounds = map.getBounds();
		const bounds_poly = coordsToJSON([
			[bounds._northEast.lat, bounds._northEast.lng],
			[bounds._southWest.lat, bounds._southWest.lng],
		]);
		const bounds_json = polygon(bounds_poly);
		const polysOnScreen = getIntersect(bounds_json, items);
		setOnScreen(polysOnScreen);
	};

	const updateColors = () => {
    if (!onScreen) return;
		const colorScale = scaleQuantile<string>()
			.domain(onScreen.map((d) => d.properties?.dataValue[mapVariable]))
			.range(colorRange);

		const quantiles = colorScale.quantiles(); //for legend
		setColorScale(() => colorScale);
		setQuantiles(quantiles);

	};

	useEffect(() => {
		setIsLoaded(true);
		if (testing) getMapData();
	}, []);

	useEffect(() => {
		//only run when variable has been selected
		if (selectedVar) {
			getMapData();
		}
	}, [selectedVar]);

	useEffect(() => {
		if (onScreen) {
			updateColors();
		}
	}, [onScreen]);

	const getMapData = () => {
		const group = selectedVar?.split('_')[0];
    const val = selectedVar?.split('_')[1];
    // This fixes potentially undefined value when we invoke createRequest
    const groupVal = group ? group : '';
    // This fixes the type when we invoke createRequest
		const variable = val ? val : '';
		setMapVariable(variable);
		const request = createRequest(groupVal, variable);

		fetchCensusData(request).then((result) => {
			const items = addData(US_counties, result.geoIdValue);
			const coloScale = scaleQuantile<string>()
				.domain(items.map((d) => d.properties.dataValue[variable]))
				.range(colorRange);
			setQuantiles(coloScale.quantiles());
			setVariables(result.variableInfo);
			setGroupInfo(result.groupInfo);
			setItems(items);
			console.log(items);
			setColorScale(() => coloScale);
		});
	};

	if (!isLoaded) {
		return <div>Loading...</div>;
	} else if (!items) {
		return (
			<Map
				ref={mapRef}
				center={[defaultMapState.lat, defaultMapState.lng]}
				zoom={defaultMapState.zoom}
				style={defaultMapState.mapStyle}
				updateWhenZooming={false}
				updateWhenIdle={true}
				preferCanvas={true}
				minZoom={defaultMapState.minZoom}
				zoomControl={false}
				//onClick={}
			>
				<TileLayer attribution={attribution} url={tileUrl} />
				<ZoomControl position="topright" />
				{/* <DataContainer /> */}
			</Map>
		);
	} else {

		return items && colorScale ? (
			<Map
				ref={mapRef}
				center={[defaultMapState.lat, defaultMapState.lng]}
				zoom={defaultMapState.zoom}
				style={defaultMapState.mapStyle}
				updateWhenZooming={false}
				updateWhenIdle={true}
				preferCanvas={true}
				minZoom={defaultMapState.minZoom}
				onMoveEnd={handleMove}
				zoomControl={false}
				//onClick={}
			>
				<TitleBlock
					title={
						groupInfo.vintage +
						' ' +
						groupInfo.description +
						' | ' +
						variables[Object.keys(variables)[0]].name.replaceAll('!!', ' ')
					}
				/>
				<TileLayer attribution={attribution} url={tileUrl} />
				<ZoomControl position="topright" />
				<GeoJSON
					ref={layerRef}
					data={items}
					style={(item) => {
						return {
							//? add variable to state to use here
							fillColor: colorScale(item ? item.properties.dataValue[mapVariable] : '#EEE'),
							fillOpacity: 0.5,
							weight: 0.5,
							opacity: 0.7,
							color: 'white',
							dashArray: '3',
						};
					}}
				/>
				<DataContainer onScreen={onScreen} />
      {/*<Legend quantiles={quantiles} colorRange={colorRange} /> */}
			</Map>
		) : (
			<h3>Data is loading...</h3>
		);
	}
};

export default DemoMap;
