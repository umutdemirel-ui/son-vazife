import * as THREE from 'three';

/** Minimum tier only. Keep skinning, instancing, decals, sRGB output and fog, but evaluate
 * dusk, the nearest practical light and the held candle at vertices, not per fragment. Uses
 * the original materials so the examination flash, bulb failure and story emissives still work. */
export class VertexLight {
  private readonly sky = { value: new THREE.Vector2() };
  private readonly practical = { value: new THREE.Vector4() };
  private readonly candle = { value: 0 };
  private readonly original = new Map<THREE.Material, THREE.Material['onBeforeCompile']>();
  private readonly compile: THREE.Material['onBeforeCompile'] = (shader) => {
    shader.uniforms.kdSky = this.sky;
    shader.uniforms.kdLamp = this.practical;
    shader.uniforms.kdCandle = this.candle;
    shader.vertexShader =
      `uniform vec2 kdSky;uniform vec4 kdLamp;uniform float kdCandle;varying vec3 kdLight;\n` +
      THREE.ShaderLib.basic.vertexShader
        .replace('#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )', '#if 1')
        .replace(
          '#include <project_vertex>',
          `#include <project_vertex>
        vec3 kdN=normalize(transformedNormal), kdUp=mat3(viewMatrix)*vec3(0.,1.,0.);
        float kdHemi=.48+.23*dot(kdN,kdUp);
        float kdSun=max(0.,dot(kdN, mat3(viewMatrix)*vec3(.469,.677,.573)));
        vec3 kdDelta=(viewMatrix*vec4(kdLamp.xyz,1.)).xyz-mvPosition.xyz;
        float kdLocal=kdLamp.w/(1.+dot(kdDelta,kdDelta));
        kdLight=vec3(.93,.97,1.)*kdSky.x*kdHemi + vec3(1.,.88,.72)*kdSky.y*kdSun*.48
          + vec3(1.,.72,.45)*(kdLocal+kdCandle/(1.+dot(mvPosition.xyz,mvPosition.xyz)))*.65;`,
        );
    shader.fragmentShader =
      `uniform vec3 emissive; varying vec3 kdLight;\n` +
      THREE.ShaderLib.basic.fragmentShader.replace(
        'vec3 outgoingLight = reflectedLight.indirectDiffuse;',
        'vec3 outgoingLight = reflectedLight.indirectDiffuse * kdLight + emissive;',
      );
  };
  include(root: THREE.Object3D) {
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      for (const m of Array.isArray(obj.material) ? obj.material : [obj.material]) {
        if (
          !(m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshLambertMaterial) ||
          this.original.has(m)
        )
          continue;
        this.original.set(m, m.onBeforeCompile);
        m.onBeforeCompile = this.compile;
        m.needsUpdate = true;
      }
    });
  }
  update(hemi: number, sun: number, practical: THREE.PointLight, candle: number) {
    this.sky.value.set(hemi, sun);
    const { x, y, z } = practical.position;
    this.practical.value.set(x, y, z, practical.intensity);
    this.candle.value = candle;
  }
  restore() {
    for (const [m, compile] of this.original) {
      m.onBeforeCompile = compile;
      m.needsUpdate = true;
    }
    this.original.clear();
  }
}
