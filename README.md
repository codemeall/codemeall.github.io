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

Key features include:

- Responsive portfolio and profile pages
- Skills, services, and technology-stack showcases
- Jekyll-powered engineering blog
- Downloadable résumé
- Animated terminal preloader, matrix background, custom cursor, counters, and scroll effects
- Reduced-motion and lower-performance device handling
- Direct links to GitHub, LinkedIn, and email

## Built With

- HTML5 and CSS3
- JavaScript
- [Jekyll](https://jekyllrb.com/) and Kramdown
- [Bootstrap 5](https://getbootstrap.com/)
- [GSAP](https://gsap.com/)
- Font Awesome
- GitHub Pages

## Repository Structure

```text
.
|-- _config.yml       # Jekyll site configuration
|-- _layouts/         # Shared blog and page layouts
|-- _posts/           # Markdown blog posts
|-- _scripts/         # Content utility scripts
|-- _templates/       # Blog post templates
|-- assets/           # Images, technology icons, and résumé
|-- blog/index.html   # Blog listing page
|-- index.html        # Main portfolio page
|-- profile.html      # Standalone profile page
|-- enhanced.css      # Main visual styling
`-- enhanced.js       # Animations and interactions
```

## Run Locally

Ruby and Jekyll are required to render the site locally.

```bash
gem install jekyll jekyll-feed jekyll-seo-tag
jekyll serve
```

Open `http://localhost:4000` in a browser. Jekyll watches the project files and rebuilds the site as they change.

## Publishing Blog Posts

Add Markdown files to `_posts` using Jekyll's `YYYY-MM-DD-title.md` naming convention. A starter template is available at `_templates/Jekyll Post Template.md`.

```yaml
---
layout: post
title: "Post title"
date: 2026-06-06 10:00:00 +0530
category: General
read_time: "5 min read"
description: "A short summary of the post."
---
```

Changes pushed to the repository's GitHub Pages branch are published at [codemeall.github.io](https://codemeall.github.io).

## Contact

- GitHub: [@codemeall](https://github.com/codemeall)
- LinkedIn: [Abdul Aziz](https://in.linkedin.com/in/abdulaziz-codemeall)
- Email: [mdab.aziz01@gmail.com](mailto:mdab.aziz01@gmail.com)
