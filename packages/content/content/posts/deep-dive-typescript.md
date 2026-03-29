---
title: Deep Dive into TypeScript Generics
date: "2024-01-15"
excerpt: TypeScript generics are one of the most powerful features in the language, enabling you to write reusable, type-safe code that works across multiple types without sacrificing correctness.
tags: ["typescript", "programming", "generics"]
category: Engineering
---

TypeScript generics are one of the most powerful features in the language, enabling you to write reusable, type-safe code that works across multiple types without sacrificing correctness. When I first encountered generics, they seemed abstract and unnecessary. After several months of writing complex TypeScript, I now reach for them constantly.

## What Are Generics?

At their core, generics are a way to write functions, classes, and interfaces that work with any type while preserving type information. Think of them as type-level variables — just as you use a variable to hold a value, a type parameter holds a type.

```typescript
// Without generics — loses type information
function identity(arg: any): any {
  return arg
}

// With generics — preserves type information
function identity<T>(arg: T): T {
  return arg
}

const result = identity<string>('hello') // result: string
const num = identity(42) // result: number (inferred)
```

The difference is subtle but crucial. The non-generic version returns `any`, meaning TypeScript gives up on tracking the type. The generic version returns `T` — whatever type you pass in, you get back.

## Generic Constraints

Raw generics are flexible but sometimes too flexible. You can constrain them with `extends` to ensure the type parameter has the shape you need:

```typescript
interface HasLength {
  length: number
}

function logLength<T extends HasLength>(arg: T): T {
  console.log(`Length: ${arg.length}`)
  return arg
}

logLength('hello')     // works — string has .length
logLength([1, 2, 3])   // works — array has .length
logLength(42)          // error — number has no .length
```

This is the pattern I use most frequently in real code. You want flexibility, but you also need to rely on certain properties being present.

## Conditional Types

One of the most advanced generic patterns is conditional types, which let you express type-level if/else logic:

```typescript
type NonNullable<T> = T extends null | undefined ? never : T

type Flatten<T> = T extends Array<infer U> ? U : T

type StringArray = Flatten<string[]>  // string
type NumberType = Flatten<number>     // number
```

The `infer` keyword is particularly powerful — it lets you extract types from within other types. I've used this pattern extensively when building type-safe API response handlers.

## Real-World Application

In my portfolio project, I used generics to build a type-safe content loader:

```typescript
interface ContentNode<T extends ContentType> {
  id: string
  type: T
  data: ContentDataMap[T]
  position: { x: number; y: number }
}

type ContentDataMap = {
  blog: BlogData
  youtube: YouTubeData
  project: ProjectData
}

function createNode<T extends ContentType>(
  type: T,
  data: ContentDataMap[T]
): ContentNode<T> {
  return {
    id: crypto.randomUUID(),
    type,
    data,
    position: { x: 0, y: 0 },
  }
}
```

This pattern ensures that when you create a `blog` node, TypeScript knows the data must be `BlogData`. When you create a `youtube` node, it must be `YouTubeData`. No runtime type checks needed.

## Why Generics Matter

The real value of generics is not just type safety — it is documentation. When you read a generic function signature, you immediately understand the relationship between inputs and outputs. `<T>(arg: T): T` tells you the return type is the same as the input. `<T, U>(arr: T[], fn: (item: T) => U): U[]` tells you this is a map operation.

Investing time to understand generics deeply pays dividends throughout your TypeScript career. They appear in almost every well-typed library and are essential for writing reusable infrastructure code.
