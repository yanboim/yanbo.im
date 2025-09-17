+++
weight = 1
title = "Styling"
[extra]
section = 3
+++

To add your own or override existing styles, create a custom style and add it in the `config.toml`:

```toml
[extra]
styles = [
  "YOUR_STYLE.css",
  "ALSO_YOUR_STYLE.css"
]
```

Additional styles are expected it to be in the `static` directory. Sass files will be compiled there by default.

If for some reason overridden style is not respected, try using `!important` (don't use it unless needed). You can import styles from Duckling using:

```scss
@use "../themes/duckling/sass/NEEDED_FILE.scss";
```

You can also load styles per page/section by setting them inside the page's front matter:

```toml
[extra]
styles = [
  "YOUR_PAGE_STYLE.css"
]
```
