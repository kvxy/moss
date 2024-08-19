struct VertexInput {
  @location(0) position: vec3f,
  @location(1) color: vec4f
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(1) color: vec4f
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
  input: VertexInput
) -> VertexOutput {
  var output: VertexOutput;
  output.position = camera.projection * camera.world * mesh.model * vec4f(input.position.xyz, 1.0);
  output.color = input.color;
  return output;
}

@fragment
fn fragment(
  input: VertexOutput
) -> @location(0) vec4f {
  return input.color;
}