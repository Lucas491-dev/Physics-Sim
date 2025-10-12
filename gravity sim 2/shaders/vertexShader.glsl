#version 300 es
in vec2 aPosition;         // particle center in world (or view) coords
uniform mat3 uView;
uniform float uPointSize;  // size in pixels or in view-space units converted on CPU

void main() {
    vec3 pos = uView * vec3(aPosition, 1.0);
    gl_Position = vec4(pos.xy, 0.0, 1.0);
    gl_PointSize = uPointSize;   // set on CPU per-particle
}
