export const attribution: string =
  '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

export const tileUrl: string =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

interface defaultMapState {
  lat: number;
  lng: number;
  zoom: number;
  minZoom: number;
  mapStyle: React.CSSProperties;
}
export const defaultMapState: defaultMapState = {
  lat: 39.8,
  lng: -98.5,
  zoom: 5,
  minZoom: 2,
  mapStyle: {
    width: '100%',
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 500,
  },
};
export const colorRange = [
  '#ffd1dc',
  '#ffad9f',
  '#ff5533',
  '#e2492d',
  '#9a311f',
  '#782618',
];
