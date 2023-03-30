```
╷ ┌───┐
└─┤ ┌─┘
  └─┴─╴
sys42
```

## ⚠️ WIP

This project is a work in progress. \
The API is not 100% stable yet, and the documentation is missing. \
You can check the tests and demos files to learn more on how to use it.

## Does this answer the Ultimate Question ?

**tl;dr**: Nope, but it can help you build interfaces and desktop-like apps using web technologies.

This project started as a cleanup of the [Windows93](https://windows93.xyz) codebase, a platform website mimicking vintage desktop interfaces.

Here is a glimpse of what's inside :

## Toolkit

Most of the files in this repository are standalone javascript and css modules/utilities.

- `core` contain system modules, mostly abstractions to help using various Web APIs
- `core/dev/testing` contain a testing framework (think ava.js/tap)
- `fabric/dom` contain DOM element manipulation modules (think jQuery)
- `fabric/type` contain javascript's primitives manipulation modules (think lodash)
- `os` contain modules for making a WebOS (think [Windows93](https://windows93.xyz))
- `themes` contain themes, assets and css utilities (think bootstrap/tailwind)
- `ui` contain a Reactive Framework for making GUIs (think Vue.js)
- `ui/components` contain our first GUI components

## Reactive Framework

Using the `ui` function is like declaring HTML using JSON. \
It has reactive templates inspired by Vue.js.

```html
<div class="destination"></div>
<script type="module">
  import ui from "/42/ui.js"

  ui(".destination", {
    tag: "main",
    content: [
      {
        tag: "button",
        content: "Increment",
        on: { click: "{{cnt++}}" },
      },
      {
        tag: "number", // Shortcut for <input type="number">
        bind: "cnt", // Two-way state binding for form controls
        label: "Counter",
        compact: true,
        // `compact: true` visually hide the label.
        // Labels are mandatory for accessibility
        // and are generated from the `bind` keyword if not specified
      },
      {
        tag: "button",
        content: "Reset",
        click: "{{reset('Reset using action')}}",
        // `click: ...` is a shortcut for `on: { click: ... }`
      },
      {
        tag: "output.solid", // Shortcut for <output class="solid">
        content: "{{cnt}}",
      },
    ],
    state: {
      cnt: 0,
    },
    actions: {
      reset(msg) {
        console.log(msg)
        this.state.cnt = 0
      },
    },
  })
</script>
```

## Components

All our UI components are written using Web Components.
You can declare most components using 3 way.

With a factory function

```js
import picto from "/42/ui/components/picto.js"
document.body.append(picto({ value: "puzzle", tooltip: "Modules" }))
```

With the `ui` function

```js
import ui from "/42/ui.js"
ui({ tag: "ui-picto", value: "puzzle", tooltip: "Modules" })
```

With an html tag

```html
<script type="module" src="/42/ui/components/picto.js"></script>
<ui-picto value="puzzle" tooltip="Modules"></ui-picto>
```

⚠️ _This can work for some components but isn't widely tested at this time_

## Project Philosophies

### Desktop First

_Desktop First_ means it's not designed as many UI components made for websites and mobile apps.
The main goal here is to make something close to GTK/Qt for HTML.
But also, in the same way the term _Mobile First_ also implies that you can make desktop apps with it, we're trying to make all our components usable by any users, on any devices and screen sizes.

### Inclusive Design

To make it short _[Inclusive Design](https://24ways.org/2016/what-the-heck-is-inclusive-design/)_ is a term combining web accessibility and responsive design.
We tried to follow good practices and semantic markup to help every users using the GUI.
Those who use small screens, touch devices, screen readers, stylus, gamepads, MIDI controllers...
(The only ones we don't think about are [Safari users](https://issafarithenewie.com/)).

### Batteries included

We tried to have as few dependencies as possible for this project.

But we also wanted to gather many useful tools for making desktop-like applications, so that project _MAY_ include some copy-pasted code.

Also, now that all modern browser supports ES Modules, we tried to skip building javascript file using bundlers, and go back to a readable _View page source_. \
That mean that the few dependencies we're using are not fetched using npm but injected in the codebase using our [CLI dev tool](#cli-dev-tool).

For consistant naming and API we refactored (and sometimes improved) many usefull scripts and styles from npm, github, stackoverflow, blogs and books.

Many thanks to all authors who shared that knowledge! We tried to mention licenses and credits as much as possible, but please [contact us](mailto:contact@windows93.net) if you think we forgot you or if you disagree with license usage.

## Fantasy OS with iframes as isolated app processes

A Fantasy OS should allow to execute 3rd party apps with the user allowing or disallowing permissions. \
The iframe's `sandbox` attribute can help to do that. \
You can read more about this in [docs/iframes.md](./docs/iframes.md).

It should also allow the creation of apps directly from the OS code editor. \
Service Worker will help to do that (we made proof of concept but it's not ready at this time). \
More about this soon...

## Tomorrow is teh future

The project being in an experimental phase, here are the current list of priorities, the order should change with maturity.

- DX (developer experience) with consistant API and function naming/signature
- DRY and modularity
- Inclusive Design (UX, a11y...)
- Security
- Performance
- Lightweight

> 🐬 Totally suitable for use in production. Trust me... im a dolphin. <sup><a href="#disclaimer">[1]</a></sup>

## Contributing

Any help is welcome, be aware that the API isn't stable yet and things can change without notice.

There is currently a lot of `TODO` comments, if you are looking for something to start.

For new features, we'll appreciate if you provide unit tests and respect the project's philosophy and coding style.

Also, before reporting a bug, please note that we're currently only supporting latest Node, Firefox and Chrome.

### Code of Conduct

Just be kind. No insults, disrespect, spam or provocative material of any kind will be tolerated in any interactions here (commit message, issues, comments...).

## CLI dev tool

The project has a NodeJS CLI dev tool nammed `sys42`. \
It is developed and tested on Linux using Node 19 but should work in Node 18.

```bash
npm install
npm ln
```

```bash
# start a dev server and watch files for live reload
sys42 serve watch
```

```bash
# generate the files.cbor file index
sys42 scan
```

```bash
# shortcut to start the serve, watch and scan command
sys42
```

A config file nammed `.42rc.js` allow to edit options for commands.

More commands was prototyped and will be included soon:

- The `annex` command will allow to fetch dependencies from npm/github as described in the [Batteries included](#batteries-included) section (you can still see the annex options we used in the current [config file](./.42rc.js)).
- The `test` command will execute tests in various environments. \
  (NodeJS and headless browsers using playwright).

<br>

---

**More things are comming soon** \
**Stay tuned <3**

---

<br>

<div id="disclaimer">
[1] If you didn't get that Windows93 private joke, be aware that <strong>sys42</strong> is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY. Without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the License for more details.
</div>
