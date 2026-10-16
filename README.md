# Abdul Aziz - Portfolio

Personal portfolio and engineering blog for [Abdul Aziz](https://codemeall.github.io), a Lead Software Engineer specializing in mobile products, full-stack platforms, backend APIs, and reusable SDK architecture.

## About Me

I am a Lead Software Engineer with more than 10 years of experience delivering production software across mobile and web platforms. I lead products from architecture through release and build solutions for iOS, Android, Huawei, and the web.

My core areas of work include:

- Mobile applications with React Native, Flutter, Swift, and Kotlin
- Reusable native and cross-platform SDKs
- Frontend platforms with React, Vue, and Next.js
- Backend services and APIs with Node.js, Python, and PHP
- Engineering leadership, architecture, consulting, and application delivery

## About This Repository

This repository contains the source for my GitHub Pages portfolio. The site presents my background, skills, technology stack, services, résumé, contact details, and technical writing.

Key features of the homepage:

- One scroll-driven story aimed at both hiring managers and clients: hero, manifesto, end-to-end ownership stack, AI team, services, "where to start" guide, experience, tech stack, engagement models and contact.
- Services that cover product engineering plus three AI offerings: hiring my hybrid (human + AI agent) team, building an AI team for your business, and mentoring/monitoring agents you already run.
- Interactive effects with no JS dependencies: particle-network hero, typed delivery console, scroll-scrubbed manifesto, pinned 3D layer stack, orbiting agent diagram, filterable bento grid, tabbed audience guide, scroll-drawn timeline, logo marquees, spotlight cards, magnetic buttons and a custom cursor.
- Respects `prefers-reduced-motion`, works without JavaScript, and is responsive down to small phones.
- Jekyll-powered engineering blog and standalone profile page.

## Built With

- HTML5 and CSS3
- JavaScript
- [Jekyll](https://jekyllrb.com/) and Kramdown
- [Bootstrap 5](https://getbootstrap.com/) and [GSAP](https://gsap.com/) (blog and profile pages)
- Font Awesome
- GitHub Pages

## Repository Structure

```text
.
|-- _config.yml       # Jekyll site configuration
|-- _layouts/         # Shared blog and page layouts
|-- _posts/           # Published blog posts
|-- _previews/        # Unpublished drafts, rendered at /preview/
|-- .pages.yml        # Pages CMS (browser editor) configuration
|-- AGENTS.md         # Rules for AI agents writing drafts
|-- _scripts/         # Content utility scripts
|-- _templates/       # Blog post templates
|-- assets/           # Images, technology icons, and résumé
|-- blog/index.html   # Blog listing page
|-- index.html        # Main portfolio page
|-- site.css          # Homepage styling
|-- site.js           # Homepage animations and interactions
|-- profile.html      # Standalone profile page
|-- enhanced.css      # Blog and profile styling
`-- enhanced.js       # Blog and profile interactions
```

## Run Locally

Ruby and Jekyll are required to render the site locally.

```bash
gem install jekyll jekyll-feed jekyll-seo-tag
jekyll serve
```

Open `http://localhost:4000` in a browser. Jekyll watches the project files and rebuilds the site as they change.

## Publishing Blog Posts

There are three ways to write, and only the owner can publish.

| Folder | What it is | Where it shows |
| --- | --- | --- |
| `_posts/` | Published posts | `/blog`, RSS feed, search engines |
| `_previews/` | Drafts, including ones written by AI agents | `/preview/<file-name>/` only (unlisted, `noindex`) |

### From the browser (Pages CMS)

1. Open [app.pagescms.org](https://app.pagescms.org), sign in with GitHub and pick this repository.
2. **Drafts** holds unpublished posts; **Published posts** is what is live. Images upload to `assets/images/`.
3. Open a draft and press **Publish** to move it into `_posts/` with the current date.

Only GitHub accounts with write access to this repository can sign in and save.

### From Obsidian

The QuickAdd "New Jekyll Post" command still creates a post straight in `_posts/` using
`_templates/Jekyll Post Template.md`, and obsidian-git pushes it.

### From AI agents

Agents follow [`AGENTS.md`](AGENTS.md): they write drafts in `_previews/<slug>.md` and never touch `_posts/`.
Review every draft at `/preview/`, then publish it from Pages CMS or from
**Actions → Publish draft → Run workflow** (enter the draft's file name).

Guard rails:

- The **Publish draft** workflow refuses to run for anyone but the repository owner.
- The **Guard published posts** check fails any pull request that changes `_posts/` from another
  account or from an agent branch (`claude/`, `codex/`, `copilot/`, `cursor/` …). To make it binding,
  protect `master` under Settings → Branches and require this check.
- An agent that pushes straight to `master` with your own credentials can't be stopped by a check.
  Only give agents a token that can push branches and open pull requests, not one that writes to `master`.

### Front matter

```yaml
---
title: "Post title"
date: 2026-06-06 10:00:00 +0530   # stamped automatically when a draft is published
category: General
tags: [Tag1, Tag2]
read_time: "5 min read"
description: "A short summary of the post."
image: /assets/images/cover.png   # optional
---
```

`layout: post` is applied automatically. Changes pushed to `master` are published at
[codemeall.github.io](https://codemeall.github.io).

## Contact

- GitHub: [@codemeall](https://github.com/codemeall)
- LinkedIn: [Abdul Aziz](https://in.linkedin.com/in/abdulaziz-codemeall)
- Email: [mdab.aziz01@gmail.com](mailto:mdab.aziz01@gmail.com)
