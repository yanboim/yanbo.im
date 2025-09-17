+++
weight = 0
title = "Getting Started"
[extra]
section = 0
+++

Duckling is a theme for the [Zola](https://www.getzola.org/) static site generator.
Follow the instructions in the [Getting Started section](https://www.getzola.org/documentation/getting-started/overview/) in their documentation.

## Installation

After having a Zola website setup, you can install the Duckling theme.

First, if you already have Git setup, add this theme as a submodule:

```bash
git submodule init
git submodule add https://git.aparoksha.dev/david-swift/duckling themes/duckling
```

Otherwise, simply clone it to your `themes` directory:

```bash
git clone https://git.aparoksha.dev/david-swift/duckling themes/duckling
```

It is highly recommended to switch from the `main` branch to the latest release:

```bash
cd themes/duckling
git checkout tags/0.1.1
```

Then, enable it in your `config.toml`:

```toml
theme = "duckling"
```

To update the theme, simply switch to a new tag:

```bash
git submodule update --remote --merge
cd themes/duckling
git checkout tags/0.1.1
```

