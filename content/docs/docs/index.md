+++
weight = 3
title = "Docs"
[extra]
section = 1
+++

Document a tool using the built-in documentation feature.

To create a documentation page, start with a [Zola section](https://www.getzola.org/documentation/content/section/).
Set the following front matter variable:

```toml
page_template = "documentation_page.html"
```

Then, add [pages](https://www.getzola.org/documentation/content/page/).
Use the `sections` front matter variable in the section and the `section` front matter variable in the individual pages to group multiple pages to a docs section.

## Options

### Section

Use the default [Zola section front matter variables](https://www.getzola.org/documentation/content/section/#front-matter) to configure the docs.
Duckling provides the following additional variable:

- `sections`: The sections available in the documentation.

Use the following syntax:

```toml
[extra]
sections = [
  "Usage",    # Section 1
  "Markdown", # Section 2
  "Advanced"  # Section 3
]
```

### Page

In addition to the [default front matter variables for pages](https://www.getzola.org/documentation/content/page/#front-matter), Duckling provides some additional variables that can be set under `[extra]`:

- `section`: Assign the page to the section with the given index. The sections are defined in the Zola section (the `_index.md`). Use `0` to place it above all the sections, `1` for the first section, etc.

The following options are available in the `[extra.comments]` section:

- `host`: The Mastodon server on which the post was posted.
- `user`: The username of the poster.
- `id`: ID of the post; the one in the URL.

## Example

The code for Duckling's docs can be used as a reference or as a starting point. It is available [in the project's source code](https://git.aparoksha.dev/david-swift/duckling/src/branch/main/content/docs).
