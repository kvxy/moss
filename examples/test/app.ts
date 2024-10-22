import * as MOSS from '../../src/moss';

const geometry = new MOSS.Geometry();
geometry.setAttribute('position', [
  -0.5, -0.5, 0.0,
   0.5, -0.5, 0.0,
   0.0,  0.5, 0.0,
])
geometry.setAttribute('color', [
  255, 0, 0, 255,
  0, 255, 0, 255,
  0, 0, 255, 255
]);

console.log(geometry);