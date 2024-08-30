import * as MOSS from '../../src/moss';

const engine = new MOSS.Engine();
document.body.appendChild(engine.canvas);
const scene = new MOSS.Scene();

const geometry = new MOSS.Geometry()
  .setAttribute('position', [
    -1, -1,  1,
    1, -1,  1,
    1,  1,  1,
  ])
  .setAttribute('color', [
    255, 0, 0, 255,
    0, 255, 0, 255,
    0, 0, 255, 255,
  ]);
const material = new MOSS.Material({
  color: new MOSS.Color(255, 255, 0)
});
const mesh = new MOSS.Mesh({
  geometry: geometry, 
  material: material
});
scene.addObject(mesh);

function tick() {
  engine.render(scene);
  requestAnimationFrame(tick);
}
tick();