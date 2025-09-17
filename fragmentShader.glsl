#version 300 es
precision mediump float;
uniform vec4 uColor;
uniform float uGlowStrength;

out vec4 outColor;

void main() {
    vec2 center = vec2(0.5, 0.5);
    float dist = length(gl_PointCoord - center);
    float glow = pow(1.0 - smoothstep(0.0, 0.5, dist), uGlowStrength);
    outColor = vec4(uColor.rgb, uColor.a * glow);
}
