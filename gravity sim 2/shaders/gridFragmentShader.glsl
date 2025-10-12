#version 300 es
precision lowp float;

uniform vec4 uColor;

void main() {
    gl_FragColor = uColor;
}