<pre style="text-align: center; line-height: 1; background: transparent">

╷ ┌───┐
└─┤ ┌─┘
  └─┴─╴
sys42

</pre>

---

## ⚠️ WIP

This project is a work in progress. \
The API is not 100% stable yet, and the documentation is missing.

---

## Does this answer the Ultimate Question ?

**tl;dr**: Nope, but it can help you build interfaces and desktop-like apps using web technologies, as depicted by [Atwood's Law](https://blog.codinghorror.com/the-principle-of-least-power/).

This project started as a cleanup of the [Windows93](https://windows93.xyz) codebase, a platform mimicking vintage desktop interfaces.

Here is a glimpse of what's inside :

## Toolkit

Most of the files in this repository are standalone javascript and css modules/utilities.

- `core` contain core modules, mostly abstractions to help using various Web APIs
- `core/dev/testing` contain a testing framework (think ava.js/tap)
- `fabric/dom` contain element manipulation modules (think jQuery)
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

Using a factory function

```js
import picto from "/42/ui/components/picto.js"
document.body.append(picto({ value: "puzzle", tooltip: "Modules" }))
```

Using the `ui` function

```js
import ui from "/42/ui.js"
ui({ tag: "ui-picto", value: "puzzle", tooltip: "Modules" })
```

Using an html tag \
_⚠️ This can work for some components but isn't widely tested at this time_

```html
<script type="module" src="/42/ui/components/picto.js"></script>
<ui-picto value="puzzle" tooltip="Modules"></ui-picto>
```

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

Also, modern browser supports ES Modules, so we tried to to skip building javascript file using bundlers. That mean that the few dependencies we use are not fetched using npm but injected in the codebase using our [CLI dev tool](#cli-dev-tool).

For consistant naming and API we refactored (and sometimes improved) many usefull scripts and styles from npm, github, stackoverflow, blogs and books.

> Some original API were too good and didn't need any changes. We did some rewrite from scratch when original scripts didn't fit well our codebase, either because original implementation was too big, too old (no ES modules) or not specific enough. \
> While doing that, an habit emmerged: STDD (Stolen Test Driven Development).

Many thanks to all authors who shared that knowledge! We tried to mention licenses and credits as much as possible, but please contact us if you think we forgot you or if you disagree with license usage.

We are aware it's not a perfect solution when considering open source contribution.
But the project modularity nature is a bit too much entangled to use most existing 3rd party modules.

## Fantasy OS with iframes as isolated app processes

Making a Fantasy OS require to execute 3rd party apps in a sandbox with user's selected permissions. \
The iframe's `sandbox` attribute can help to do that. \
You can read more about this in [docs/iframes.md](./docs/iframes.md).

It should also allow the creation of apps directly from the OS code editor. \
Service Worker will help to do that (not ready at this time). \
More about this soon...

## Tomorrow is teh future

The project is still in an experimental phase, here are the current list of priorities, the order should change with maturity.

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

The project has a NodeJS CLI dev tool nammed `42`. \
It is developed and tested on Node 19 but should work in Node 18.

```bash
npm install
npm ln
```

```bash
# start a dev server and watch files for live reload
42 serve watch
```

```bash
# generate the files.cbor file index
42 scan
```

```bash
# shortcut to start the serve, watch and scan command
42
```

A config file nammed `.42rc.js` allow to edit options for commands.

More commands was prototyped and will be included soon :

- The `annex` command allow to fetch modules from npm/github as described in the [Batteries included](#batteries-included) section (you can still see the annex options we used in the current [config file](./.42rc.js)).
- The `test` command will execute test in various environments. \
  (NodeJS and headless browsers using playwright).

---

**Thanks for your attention, many things are comming next, stay tuned <3**

<pre id="disclaimer" style="font-size: 70%; line-height:1.2;">
[1] If you didn't get that Windows93 private joke, be aware that <strong>sys42</strong> is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY. Without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the License for more details.
</pre>
