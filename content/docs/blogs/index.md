+++
weight = 1
title = "Blogs"
[extra]
section = 1
+++

A blog is a place to publish articles. Take a look at the [sample blog](/blog).

To create a blog, start with a [Zola section](https://www.getzola.org/documentation/content/section/).
Set the following front matter variables:

```toml
template = "article_list.html"
page_template = "article.html"
```

Then, add [pages](https://www.getzola.org/documentation/content/page/).

## Options

Use the default [Zola section front matter variables](https://www.getzola.org/documentation/content/section/#front-matter) to configure the blog.
In addition to the [default front matter variables for pages](https://www.getzola.org/documentation/content/page/#front-matter), Duckling provides some additional variables that can be set under `[extra]`:

- `banner`: Filename of the [colocated](https://www.getzola.org/documentation/content/overview/#asset-colocation) banner image. Recommended dimensions are 2:1 aspect ratio and 1920x960 resolution, make sure it works with the navigation bar in light and dark mode.
- `banner_pixels` Makes the banner use nearest neighbor algorithm for scaling, useful for keeping pixel-art sharp.
- `archived`: Make the post visually stand out in the post list. Also accepts message as a value.
- `featured`: Ditto but doesn't accept message as a value.
- `hot`: Ditto.
- `poor`: Ditto.

The following options are available in the `[extra.comments]` section:

- `host`: The Mastodon server on which the post was posted.
- `user`: The username of the poster.
- `id`: ID of the post; the one in the URL.

## Example

The code for the [sample blog](/blog) can be used as a reference or as a starting point. It is available [in the project's source code](https://git.aparoksha.dev/david-swift/duckling/src/branch/main/content/blog).
