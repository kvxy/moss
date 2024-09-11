struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f
}

struct Mesh {
  model: mat4x4f
}

@group(0) @binding(0)
var<uniform> mesh: Mesh;

@vertex
fn vertex(
  @location(0) position: vec3f,
  @location(1) color: vec4u,
  @builtin(vertex_index) vertexIndex: u32
) -> VertexOutput {
  var output: VertexOutput;
  output.position = mesh.model * vec4f(position, 1.0);
  output.color = vec4f(color) / 255.0;
  return output;
}

@fragment
fn fragment(
  input: VertexOutput
) -> @location(0) vec4f {
  return input.color;
}