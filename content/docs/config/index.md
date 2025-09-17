+++
weight = 1
title = "Configuration"
[extra]
section = 0
+++

Duckling offers a number of variables that can be set in the a website's `config.toml` file.

The following configuration variables from `config.toml` can be set/overridden per page/section:

- `default_theme`: Which theme should be used by default (light/dark).
- `accent_color`: Sets theme and [browser theme](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta/name/theme-color) color.
- `accent_color_dark`: Ditto but for the dark theme. If not set regular variant will be used.
- `emoji_favicon`: Use emoji as a favicon. Only one emoji is being rendered, everything else is truncated.
- `styles`: Additional CSS styles; expects them to be in the `./static/` directory. If you are using Sass it will be generated there automatically.
- `scripts`: Additional JavaScript scripts; expects them to be in the `./static/` directory.
- `katex`: Whether to enable the KaTeX library for rendering LaTeX.
- `toc`: Enables table of contents. Only first 2 levels of headings are listed.
- `toc_inline`: Whether to render inline table of contents at the top of all pages, in addition to floating quick navigation buttons.
- `toc_ordered`: Whether to use numbered (ordered) list for table of contents.

The following variables can be set in the `config.toml` file:

- `apple_touch_icon`: Filename of the [colocated](https://www.getzola.org/documentation/content/overview/#asset-colocation) Apple Touch Icon.
- `favicon`: Filename of the [colocated](https://www.getzola.org/documentation/content/overview/#asset-colocation) favicon.
- `card`: Filename of the [colocated](https://www.getzola.org/documentation/content/overview/#asset-colocation) metadata card.
- `archive`: Displays an archived message.
- `trigger`: Displays a trigger warning message.
- `disclaimer`: Displays a disclaimer message.
- `left_align_badges`: Left-align badges in subprojects lists.
- `hide_subproject_tags`: Hide the link to the list of tags in subprojects lists.
- `hide_number_of_subprojects`: Hide the subprojects counter in a subproject list.

## Favicon

Files named `favicon.png` and `apple-touch-icon.png` are used as favicon and Apple Touch Icon respectively. For animated favicon you can use APNG with the `png` file extension.

