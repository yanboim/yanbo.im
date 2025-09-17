+++
weight = 2
title = "Subprojects"
[extra]
section = 1
+++

The subprojects feature is designed to showcase the capabilities of a project, but it can be used for many other purposes as well.
Check out the demo [here](/subprojects).

To create a collection of subprojects, start with a [Zola section](https://www.getzola.org/documentation/content/section/).
Set the following front matter variables:

```toml
template = "subproject_list.html"
page_template = "subproject.html"
```

Then, add [pages](https://www.getzola.org/documentation/content/page/).
Make sure to set the `preview` front matter variable if you want to include a preview picture in the collection.

## Options

Use the default [Zola section front matter variables](https://www.getzola.org/documentation/content/section/#front-matter) to configure the subprojects collection.
In addition to the [default front matter variables for pages](https://www.getzola.org/documentation/content/page/#front-matter), Duckling provides some additional variables that can be set under `[extra]`:

- `preview`: Filename of the image displayed in the subprojects list.
- `expand`: Make the subproject use the full width in the subprojects list.
- `url`: Instead of showing the page's content, redirect from the subprojects list to the given URL.
- `badge`: A label displayed in the item's corner in the subprojects list.
- `banner`: Filename of the [colocated](https://www.getzola.org/documentation/content/overview/#asset-colocation) banner image. Recommended dimensions are 2:1 aspect ratio and 1920x960 resolution, make sure it works with the navigation bar in light and dark mode.
- `banner_pixels` Makes the banner use nearest neighbor algorithm for scaling, useful for keeping pixel-art sharp.

The following options are available in the `[extra.comments]` section:

- `host`: The Mastodon server on which the post was posted.
- `user`: The username of the poster.
- `id`: ID of the post; the one in the URL.

## Example

The code for the [sample subproject collection](/subprojects) can be used as a reference or as a starting point. It is available [in the project's source code](https://git.aparoksha.dev/david-swift/duckling/src/branch/main/content/subprojects).
