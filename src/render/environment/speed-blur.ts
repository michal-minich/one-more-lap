import type { Camera } from "@babylonjs/core/Cameras/camera.js";
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess.js";

const name = "raceSpeedBlur";

ShaderStore.ShadersStore[name + "PixelShader"] = `
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float strength;
void main(void) {
    vec2 radius = vUV - vec2(0.5, 0.53);
    vec2 streak = radius * strength * smoothstep(0.12, 0.65, length(radius));
    gl_FragColor = texture2D(textureSampler, vUV) * 0.50
        + (texture2D(textureSampler, vUV + streak * 0.48)
        + texture2D(textureSampler, vUV - streak * 0.48)) * 0.18
        + (texture2D(textureSampler, vUV + streak)
        + texture2D(textureSampler, vUV - streak)) * 0.07;
}`;

ShaderStore.ShadersStoreWGSL[name + "PixelShader"] = `
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;
uniform strength: f32;
@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let uv = input.vUV;
    let radius = uv - vec2f(0.5, 0.53);
    let streak = radius * uniforms.strength * smoothstep(0.12, 0.65, length(radius));
    fragmentOutputs.color = textureSample(textureSampler, textureSamplerSampler, uv) * 0.50
        + (textureSample(textureSampler, textureSamplerSampler, uv + streak * 0.48)
        + textureSample(textureSampler, textureSamplerSampler, uv - streak * 0.48)) * 0.18
        + (textureSample(textureSampler, textureSamplerSampler, uv + streak)
        + textureSample(textureSampler, textureSamplerSampler, uv - streak)) * 0.07;
}`;

export class SpeedBlur {
    readonly #camera: Camera;
    #post: PostProcess | undefined;
    #attached = false;
    #strength = 0;

    constructor(camera: Camera) {
        this.#camera = camera;
    }

    update(speed: number, dt: number): void {
        const progress = Math.max(0, Math.min(1, (speed - 40) / 32));
        this.#strength += (progress * progress * 0.028 - this.#strength) * Math.min(1, dt * 6);
        if (this.#strength < 0.0006) {
            if (this.#attached) this.#camera.detachPostProcess(this.#post!);
            this.#attached = false;
            return;
        }
        if (this.#attached) return;
        if (!this.#post) {
            const engine = this.#camera.getEngine();
            const post = new PostProcess(name, name, {
                engine, size: 1, uniforms: ["strength"], samplingMode: Texture.BILINEAR_SAMPLINGMODE,
                shaderLanguage: engine.isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            });
            post.onApply = effect => effect.setFloat("strength", this.#strength);
            this.#post = post;
        }
        this.#camera.attachPostProcess(this.#post);
        this.#attached = true;
    }

    dispose(): void {
        this.#post?.dispose(this.#camera);
    }
}
