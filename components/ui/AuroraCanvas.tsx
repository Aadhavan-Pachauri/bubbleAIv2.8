import React, { useRef, useEffect } from "react";

export default function AuroraCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl;
    try {
      gl = canvas.getContext("webgl");
      if (!gl) throw new Error("WebGL not supported");
    } catch (e) {
      console.warn("WebGL not supported by this browser.");
      return;
    }

    let animationFrameId;

    const setup = () => {
      if (!gl) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const vertexShaderSrc = `
        attribute vec2 a_position;
        varying vec2 v_uv;
        void main() {
          v_uv = a_position * 0.5 + 0.5;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fragmentShaderSrc = `
        precision highp float;
        varying vec2 v_uv;
        uniform float u_time;
        uniform vec2 u_resolution;

        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
        }

        float fbm(vec2 st) {
          float value = 0.0;
          float amplitude = .5;
          for (int i = 0; i < 6; i++) {
            value += amplitude * noise(st);
            st *= 2.0;
            amplitude *= .5;
          }
          return value;
        }

        void main() {
          vec2 uv = v_uv;
          uv.x *= u_resolution.x / u_resolution.y;
          float time = u_time * 0.1;

          vec3 color1 = vec3(0.6, 0.3, 0.8);
          vec3 color2 = vec3(0.2, 0.4, 0.9);
          vec3 color3 = vec3(0.1, 0.6, 0.7);

          float noise1 = fbm(uv * 2.0 + time * 0.2);
          float noise2 = fbm(uv * 1.5 - time * 0.15);

          vec3 finalColor = vec3(0.05, 0.05, 0.1);
          finalColor = mix(finalColor, color1, smoothstep(0.3, 0.6, noise1));
          finalColor = mix(finalColor, color2, smoothstep(0.4, 0.7, noise2));
          finalColor = mix(finalColor, color3, smoothstep(0.5, 0.8, fbm(uv + time * 0.1)));

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `;

      const compileShader = (type, source) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error("Shader compile error:", gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSrc);
      const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);

      if (!vertexShader || !fragmentShader) return;

      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const a_position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

      const u_time = gl.getUniformLocation(program, "u_time");
      const u_resolution = gl.getUniformLocation(program, "u_resolution");

      const render = (time) => {
        if (!gl) return;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(u_time, time * 0.001);
        gl.uniform2f(u_resolution, gl.canvas.width, gl.canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        animationFrameId = requestAnimationFrame(render);
      };

      animationFrameId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      if (!gl) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    };

    setup();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full -z-10" style={{ filter: "blur(80px)", opacity: 0.6 }} />;
}