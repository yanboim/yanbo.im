+++
weight = 0
title = "Localization"
[extra]
section = 3
+++

Duckling ships with a localization system based on one used in [tabi](https://github.com/welpo/tabi), which is easy to use and flexible at the same time.

To add a translation, simply create a file in your site's `i18n` directory called `LANG_CODE.toml`, e.g `fr.toml`. The language code should be either [ISO 639-1](https://localizely.com/iso-639-1-list/) or [BCP 47](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry).

Inside that file, copy-paste the [English translation from Duckling](https://git.aparoksha.dev/david-swift/duckling/src/branch/main/i18n/en.toml) and adapt it to your needs. You can also check [tabi](https://github.com/welpo/tabi/tree/main/i18n) translation files for reference.

Additionally to translating Duckling, you can override the English strings by providing a `en.toml` file.
