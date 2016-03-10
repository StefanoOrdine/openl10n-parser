# openl10n-parser

openl10n translations parser

## Use

Consider the following openl10n translations folder:

```
src/translations
├── common.da.xlf
├── common.en.xlf
├── common.es.xlf
├── common.fr_BE.xlf
├── common.fr_CH.xlf
├── ...
├── customer.da.xlf
├── customer.en.xlf
├── customer.es.xlf
├── customer.fr_BE.xlf
├── customer.fr_CH.xlf
├── ...
```

Then in you nodejs code:

```JS
import OpenL10nParser from 'openl10n-parser';

new OpenL10nParser().parseFolder('./src/translations').then(({bundledTranslations}) => {
    /* bundledTranslations is 
    { 
      da: {
        common: { ... },
        customer: { ... },
        ...
      },
      en: {
        common: { ... },
        customer: { ... },
        ...
      },
      ...
    }
    */
});
```
