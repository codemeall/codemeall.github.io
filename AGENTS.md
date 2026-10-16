# Instructions for AI agents

This repository is Abdul Aziz's portfolio and blog (Jekyll on GitHub Pages).
You may write blog posts, but **you never publish them**. Abdul reviews and publishes.

## Writing a blog post

1. Create the draft in `_previews/<slug>.md`, where `<slug>` is the title in
   lowercase kebab-case (for example `_previews/why-sdks-need-contracts.md`).
   No date in the file name.
2. Start the file with this front matter:

   ```yaml
   ---
   title: "Post title"
   category: General
   tags: [Tag1, Tag2]
   description: "One or two sentences for the blog card and search results."
   read_time: "5 min read"
   author: "<your agent name, e.g. Claude>"
   image: /assets/images/<file>   # optional cover image
   ---
   ```

   Do not set `layout` (it is set for you) and do not set `date` (it is stamped when published).
3. Write the body in Markdown below the front matter. Put images in `assets/images/`.
4. Commit only the draft and its images. The draft is then viewable at
   `https://codemeall.github.io/preview/<slug>/` and listed at `/preview/`.
   Tell Abdul the preview link.

## Rules

- **Never** create, edit, rename or delete anything in `_posts/`. Those files are live.
- **Never** run the "Publish draft" workflow or move files from `_previews/` to `_posts/`.
- Do not change `_config.yml`, `.pages.yml`, `.github/` or the layouts unless Abdul asks.
- To revise a published post, write the new version as a draft in `_previews/` and say which post it replaces.
