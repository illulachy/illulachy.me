# Add Node Skill

## Description
Add new content nodes (milestones, projects, YouTube videos, blog posts) to the illulachy.me timeline. Ask the user detailed questions first, then refine with marketing voice if needed.

## When to use
Use this when the user wants to add new content to their portfolio timeline.

## Workflow

### Step 1: Ask Content Details
Ask the user these questions one at a time:

1. **What type of content?**
   - Milestone (career/personal achievements)
   - Project (things you've built)
   - YouTube videos
   - Blog posts

2. **For Milestone:**
   - What happened? (title/event)
   - When? (date - Month Year)
   - What institution or company?
   - What was your role?
   - Any key tech or skills involved?
   - Brief description (1-2 sentences)

3. **For Project:**
   - Project name/title
   - When did you build it?
   - What technologies used?
   - What's the URL (GitHub/demo)? Use "#" if not available yet
   - Brief description of what it does

4. **For YouTube:**
   - Video title
   - Video date
   - YouTube URL
   - Video description (1-2 sentences)

5. **For Blog:**
   - Blog post title
   - Publication date
   - URL if published
   - Brief description/excerpt
   - Tags (optional)

### Step 2: Confirm Draft
Write a draft markdown with frontmatter. Show the user and ask for confirmation before saving.

### Step 3: Refine with Marketing Voice (if needed)
After confirmation, ask: "Would you like me to refine the title/description with marketing style?" 
If yes, improve the title and description to be more compelling and marketing-friendly.

### Step 4: Save File
Write the final content to the appropriate year folder in `/packages/content/content/{year}/`.

## File naming convention
Use kebab-case for filenames, e.g., `first-ai-engineer-job.md`, `toolazy-to-read.md`

## Frontmatter format

**Milestone:**
```yaml
---
type: milestone
title: Your Title
date: Month Year
institution: Company/School
role: Your Role (optional)
tech: Technologies (optional)
description: Brief description
---
```

**Project:**
```yaml
---
type: project
title: Project Title
date: Year (e.g., 2021, April 2018)
url: https://... (optional, but required for validation - use "#" if no URL)
tech: Tech stack
description: Brief description
---
```

**YouTube:**
```yaml
---
type: youtube
title: Video Title
date: Month Day, Year
url: https://youtube.com/watch?v=...
description: Video description
---
```

**Blog:**
```yaml
---
type: blog
title: Blog Post Title
date: Month Day, Year
url: https://...
description: Brief description
tags: ["tag1", "tag2"]
category: Engineering/Reflections
---
```