import * as MOSS from '../../src/moss';

const engine = new MOSS.Engine();
document.body.appendChild(engine.canvas);
const scene = new MOSS.Scene();

const geometry = new MOSS.Geometry();
const buffer = geometry.getDefaultVertexBuffer();
buffer.setAttributeData('position', [
  -1, -1,  1,
	 1, -1,  1,
	 1,  1,  1,

	 1,  1,  1,
	-1,  1,  1,
	-1, -1,  1
]);
const material = new MOSS.Material({
  color: new MOSS.Color(255, 255, 0)
});
const mesh = new MOSS.Mesh({
  geometry: geometry, 
  material: material
});
scene.addMesh(mesh);

console.log(geometry);

function tick() {
  engine.render(scene);
  requestAnimationFrame(tick);
}
tick();