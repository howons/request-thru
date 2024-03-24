<img src="assets/img/icon-128.png" width="64"/>

# Chrome Extension (MV3) Boilerplate with React 18 and Vite 5

[//]: # 'TODO: Publish the template on NPM'
[//]: # '[![npm](https://img.shields.io/npm/v/chrome-extension-boilerplate-react)](https://www.npmjs.com/package/chrome-extension-boilerplate-react)'
[//]: # '[![npm-download](https://img.shields.io/npm/dw/chrome-extension-boilerplate-react)](https://www.npmjs.com/package/chrome-extension-boilerplate-react)'
[//]: # '[![npm](https://img.shields.io/npm/dm/chrome-extension-boilerplate-react)](https://www.npmjs.com/package/chrome-extension-boilerplate-react)'

This repository contains a boilerplate for building Chrome Extensions with React 18, TypeScript, and Vite 5.
This boilerplate is inspired by and adapted
from [chrome-extension-boilerplate-react](https://github.com/lxieyang/chrome-extension-boilerplate-react).

## Features

This is a basic Chrome Extensions boilerplate to help you write modular and modern Javascript code and load CSS easily.
This boilerplate is updated with:

- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-overview/)
- [React 18](https://reactjs.org)
- [MUI](https://mui.com/)
- ESLint:
  - [eslint-plugin-react](https://www.npmjs.com/package/eslint-plugin-react)
  - [eslint-config-prettier](https://www.npmjs.com/package/eslint-config-prettier)
  - [eslint-plugin-simple-import-sort](https://www.npmjs.com/package/eslint-plugin-simple-import-sort)
  - [typescript-eslint](https://www.npmjs.com/package/typescript-eslint)
- [Prettier](https://prettier.io/)
- [TypeScript](https://www.typescriptlang.org/)

I have avoided using CRXJS Vite Plugin on purpose as it's last update was in 2022, and it could possibly have some
issues with newer versions of Vite.

Please open up an issue to nudge me to keep the npm packages up-to-date.

## Installing and Running

### Procedures:

1. Check if your [Node.js](https://nodejs.org/) version is >= **18**.
2. Clone this repository.
3. Change the package's `name`, `description`, and `repository` fields in `package.json`.
4. Change the name of your extension on `src/manifest.json`.
5. Run `yarn install` to install the dependencies.
6. Run `yarn dist`
7. Load your extension on Chrome following:
   1. Access `chrome://extensions/`
   2. Turn the `Developer mode` switch on (top right corner)
   3. Click on `Load unpacked`
   4. Select the `dist` folder.
8. Happy hacking.

## Structure

All your extension's code must be placed in the `src` folder.

The boilerplate is already prepared to have a popup, a background script, and a content script.
This example Chrome extension implements logic which lets the user scrape the page title.
It was done so to demonstrate some of the [chrome API](https://developer.chrome.com/docs/extensions/reference/api)
functionality.

## TypeScript

This boilerplate supports TypeScript! Everything that can be written in TypeScript is written in TypeScript.

## Change Watchers

This boilerplate has watch scripts for the popup (`yarn watch:popup`), background script (`yarn watch:background`), and
content script (`yarn watch:content`).
`yarn dist` has to be run first to copy assets, `manifest.json` and Chrome extension files to the `dist` folder.

## Packing

After the development of your extension run the command

```
$ yarn dist
```

Now, the content of `dist` folder will be the extension ready to be submitted to the Chrome Web Store. Just take a look
at the [official guide](https://developer.chrome.com/webstore/publish) to more infos about publishing.

## Resources:

- [Chrome Extension documentation](https://developer.chrome.com/extensions/getstarted)

---

Tomasz Kiljańczyk | [Website](https://github.com/Gunock)
