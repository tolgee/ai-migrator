## Tolgee AI i18n migrator

This tool is used to migrate your app code from raw string to use Tolgee SDKs, so you can manage
your localization effectively with Tolgee.

## Motivation

Although we still recommend to prepare your project for localization from the beginning, the reality
is that many developers start with raw strings and then decide to localize their app.

This tool is here to help you with this process. It will scan your project for raw strings and
replace them with Tolgee SDK calls.

e.g. for React, it will replace:
```typescript jsx
export const WelcomeMessage = () => {
  return <div>Welcome!</div>;
};
```

with:
```typescript jsx
import { T } from '@tolgee/react';
export const WelcomeMessage = () => {
  return <div><T keyName="welcome-message" /></div>
}
```

## Usage

1. Install the tool globally:
```bash
npm install -g @tolgee/ai-migrator
```
