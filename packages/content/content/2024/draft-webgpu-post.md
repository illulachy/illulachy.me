---
type: blog
title: Exploring WebGPU for Rendering
date: April 2024
url: https://writing.illulachy.me/webgpu
draft: true
description: Work in progress
excerpt: WebGPU is the successor to WebGL, offering a modern GPU API for the browser. After spending time exploring it for a personal project, I want to share what I learned about its capabilities, its developer experience, and where it is heading.
tags: ["webgpu", "graphics", "web"]
category: Engineering
---

WebGPU is the successor to WebGL, offering a modern GPU API for the browser. After spending time exploring it for a personal project, I want to share what I learned about its capabilities, its developer experience, and where it is heading. This is not a comprehensive tutorial — it is an honest account of what it is like to work with WebGPU as someone coming from a web background.

## What Is WebGPU?

WebGPU is a JavaScript API that provides access to the GPU in the browser. Unlike WebGL which wraps the older OpenGL API, WebGPU is built on modern GPU APIs: Vulkan on Linux/Android, Metal on macOS/iOS, and Direct3D 12 on Windows. This gives it access to more modern GPU capabilities and a more ergonomic programming model.

The API landed in Chrome 113 in May 2023 and is available in Firefox and Safari behind flags. As of early 2024, it is broadly available in modern browsers without flags.

## Setting Up a Basic Pipeline

WebGPU requires more boilerplate than WebGL, but the structure is cleaner. Here is the minimal setup:

```typescript
async function initWebGPU(canvas: HTMLCanvasElement) {
  if (!navigator.gpu) {
    throw new Error('WebGPU not supported')
  }

  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    throw new Error('No GPU adapter found')
  }

  const device = await adapter.requestDevice()
  const context = canvas.getContext('webgpu')!
  const format = navigator.gpu.getPreferredCanvasFormat()

  context.configure({
    device,
    format,
    alphaMode: 'premultiplied',
  })

  return { device, context, format }
}
```

The `device` is the central object — all GPU work flows through it. You create buffers, textures, pipelines, and command encoders from the device.

## Writing Shaders in WGSL

WebGPU uses its own shading language, WGSL (WebGPU Shading Language). It is a compiled language that runs on the GPU. Here is a simple vertex and fragment shader:

```wgsl
// Vertex shader
@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> @builtin(position) vec4f {
  var positions = array<vec2f, 3>(
    vec2f(0.0, 0.5),
    vec2f(-0.5, -0.5),
    vec2f(0.5, -0.5),
  );
  let pos = positions[vertex_index];
  return vec4f(pos, 0.0, 1.0);
}

// Fragment shader
@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(0.878, 0.686, 1.0, 1.0); // Mauve color
}
```

WGSL has a familiar syntax for anyone who has written C, Rust, or TypeScript. The type system is explicit — you specify whether a value is a `vec2f` (2D float vector) or `vec4f` (4D float vector) — no implicit conversions.

## The Render Pipeline

The render pipeline is the central abstraction. It describes how GPU data flows from vertex input to pixel output:

```typescript
const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: {
    module: shaderModule,
    entryPoint: 'vs_main',
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'fs_main',
    targets: [{ format }],
  },
  primitive: {
    topology: 'triangle-list',
  },
})
```

The pipeline is immutable — once created, you cannot change it. This is intentional. Modern GPUs optimize heavily based on the pipeline configuration, and mutability would prevent those optimizations.

## What Surprised Me

**Explicit memory management.** You allocate GPU buffers manually and manage their lifetimes. This is very different from working with Three.js or the DOM, where garbage collection handles memory. Getting this right requires thinking like a systems programmer.

**The error handling is excellent.** WebGPU has a robust error reporting system. When you make a mistake (wrong buffer size, invalid shader), you get clear error messages telling you exactly what went wrong. This is a significant improvement over WebGL.

**Compute shaders are first-class.** Unlike WebGL, WebGPU has built-in support for compute shaders. This opens up general-purpose GPU computing for web applications — machine learning inference, physics simulations, image processing.

## Current Limitations

**Browser support is not universal.** Mobile support lags behind desktop. Safari on iOS requires iOS 18+. If you need broad mobile support today, WebGL is safer.

**The API is verbose.** Building even simple things requires significant boilerplate. Libraries like wgpu-matrix (for math) and WebGPU best practices guides help, but the low-level nature means high development overhead compared to Three.js.

**Learning resources are sparse.** WebGL has a decade of tutorials, examples, and Stack Overflow answers. WebGPU is new, and the community is still building its knowledge base.

## Should You Use WebGPU?

For most web applications, no. The complexity cost is high and browser support excludes a meaningful portion of users. Three.js, which now supports WebGPU as a backend, is a much better starting point for 3D graphics.

But if you need fine-grained GPU control — custom rendering algorithms, GPU compute, research projects — WebGPU is the right tool. The API is well-designed, the performance is excellent, and it is clearly the future of web graphics.

I am glad I explored it. Even if I do not use raw WebGPU in production work, understanding how the GPU pipeline works has made me a better developer. The mental models transfer to Three.js, WebGL, and even to thinking about CPU-side rendering performance.
