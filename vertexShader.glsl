#version 300 es
in vec2 aPosition;
uniform mat3 uView;   // 2D camera matrix

void main() {
    vec3 pos = uView * vec3(aPosition, 1.0);
    gl_Position = vec4(pos.xy, 0.0, 1.0);
}
