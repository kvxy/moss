struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f
}

struct Mesh {
  model: mat4x4f
}

struct Camera {
  projection: mat4x4f,
  world:  mat4x4f
}

@group(0) @binding(0)
var<uniform> camera: Camera;

@group(1) @binding(0)
var<uniform> mesh: Mesh;

@vertex
fn vertex(
  @location(0) position: vec3f,
  @location(1) color: vec4u
) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4f(position.xyz, 1.0); // camera.projection * camera.world * mesh.model * 
  output.color = vec4f(color) / 255.0;
  return output;
}

@fragment
fn fragment(
  input: VertexOutput
) -> @location(0) vec4f {
  // return vec4f(input.color) / 255.0;
  return vec4f(1, 0, 0, 1);
}