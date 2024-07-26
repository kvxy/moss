import { Color, Geometry, Material, Mesh, Renderer, Scene, TypedList } from '../../src/moss';

const renderer = new Renderer();
const scene = new Scene();
const mesh = new Mesh({
  geometry: new Geometry({ 
    vertices: new TypedList(new Float32Array(1)),
    indices: new TypedList(new Uint16Array(1))
  }).createVertexAttribute('position', { format: 'float32x3' })
    .createVertexAttribute('texcoord', { format: 'float32x2' })
    .setVertexAttributeData('position', [
      0, 0, 0,
      1, 0, 0,
      1, 1, 0,

      0, 0, 0,
      0, 1, 0,
      1, 1, 0
    ])
    .setVertexAttributeData('texcoord', [
      0, 0,
      1, 0,
      1, 1,

      0, 0,
      0, 1,
      1, 1
    ]),
  material: new Material({ color: new Color(255, 0, 0) })
});

scene.addMesh(mesh);
renderer.render(scene);