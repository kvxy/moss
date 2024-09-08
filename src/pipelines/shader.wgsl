struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f
}

@vertex
fn vertex(
  @location(0) position: vec3f,
  @location(1) color: vec4u
) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4f(position.xyz, 1.0);
  output.color = vec4f(color) / 255.0;
  return output;
}

@fragment
fn fragment(
  input: VertexOutput
) -> @location(0) vec4f {
  return vec4f(input.color) / 255.0;
}