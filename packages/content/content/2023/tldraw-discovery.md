---
type: blog
title: Discovering tldraw — An Infinite Canvas Library
date: November 3, 2023
url: https://writing.illulachy.me/tldraw-discovery
description: First impressions of tldraw for creative tools
excerpt: I had been looking for a way to build an infinite canvas for my portfolio site when I stumbled on tldraw. What I found was not just a library but a thoughtfully designed system for building canvas-based applications.
tags: ["tldraw", "canvas", "open-source"]
category: Engineering
---

I had been looking for a way to build an infinite canvas for my portfolio site when I stumbled on tldraw. What I found was not just a library but a thoughtfully designed system for building canvas-based applications. After spending a week building with it, I wanted to share my first impressions and what makes it stand out.

## The Problem I Was Solving

My portfolio concept was an infinite canvas where visitors could pan and zoom through a timeline of my work — blog posts, YouTube videos, projects, milestones. The kind of experience you get in Figma or Miro, but purpose-built for presenting a personal narrative.

Building pan/zoom canvas from scratch is deceptively complex. You need to handle:

- Mouse and touch event normalization
- Coordinate space transformations (screen to canvas)
- Smooth zoom with focal point preservation
- Performance optimizations for many rendered elements
- Keyboard navigation
- Viewport culling

I estimated this would take several weeks to build well. Then I found tldraw.

## What Is tldraw?

tldraw is an open-source whiteboard application built on a powerful canvas engine. But more importantly for developers, it exposes that engine as a library you can use in your own applications. You can build custom shapes, respond to events, and integrate it into any React application.

The project is maintained by a small team who clearly thinks deeply about the design of their API. The documentation is excellent, the TypeScript types are comprehensive, and the examples cover a wide range of use cases.

## Building Custom Shapes

The key abstraction in tldraw is the custom shape. You define a shape component as a React component, register it with the editor, and tldraw handles the rest — rendering, selection, movement, resizing.

Here is what a minimal custom shape looks like conceptually:

```typescript
class BlogPostShape extends ShapeUtil<BlogPostShapeProps> {
  static override type = 'blog-post' as const

  override getDefaultProps(): BlogPostShapeProps {
    return {
      title: 'Untitled',
      excerpt: '',
      url: '',
      date: '',
    }
  }

  override component(shape: TLShape & { props: BlogPostShapeProps }) {
    return (
      <div className="blog-card">
        <h3>{shape.props.title}</h3>
        <p>{shape.props.excerpt}</p>
      </div>
    )
  }
}
```

The tldraw editor then handles placing this shape on the canvas, making it draggable, zoomable, and selectable. You get all of that behavior for free.

## Performance Observations

I was concerned about performance with many nodes on the canvas. My timeline eventually includes 30+ content nodes, and I wanted to ensure it felt smooth.

tldraw handles this well. It uses React's rendering pipeline efficiently, only re-rendering shapes that have changed. On a reasonably modern machine, 50+ custom shapes pan and zoom smoothly without any optimization on my part.

For very large canvases (hundreds of nodes), you would want to implement viewport culling — only rendering shapes in or near the visible viewport. tldraw exposes the viewport state, making this possible to implement yourself.

## What I Liked

**The TypeScript types are excellent.** Working with tldraw in a typed codebase feels ergonomic. The editor API is well-typed, custom shape props are type-safe, and the event system has good inference.

**The coordinate system is intuitive.** Once you understand the screen/canvas coordinate distinction, everything clicks. The editor provides utilities for converting between the two.

**The community is active.** The GitHub discussions and Discord have knowledgeable people who respond quickly. For an open-source project, the support quality is unusually high.

## What Took Adjustment

**The bundle size is substantial.** tldraw is a full-featured whiteboard application. If you are building a lightweight canvas, the dependency weight might be more than you want. For my portfolio, the trade-off was worth it.

**The API surface is large.** There is a lot to learn. I spent a week just reading the source code and examples before I felt comfortable. The documentation helps, but it is not exhaustive.

## Conclusion

For building a sophisticated canvas experience in React without reinventing the wheel, tldraw is an excellent choice. It saved me weeks of development time and produced a better result than I would have built from scratch.

If you are building something that benefits from an infinite canvas — collaborative tools, visual timelines, mind maps, creative apps — I strongly recommend evaluating tldraw before building your own solution.
