<pre style="text-align: center; line-height: 1; background: transparent">

╷ ┌───┐
└─┤ ┌─┘
  └─┴─╴
sys42

</pre>

## Does this answer the Ultimate Question ?

tl;dr: Nope, but it can help you build desktop interfaces using web technologies.

### Fine, but why making desktop-like GUI on the web ?

Because this project started as a cleanup of the [windows93.net](https://windows93.xyz) codebase, a website mimicking old microsoft windows interfaces.

Also, [Atwood's Law](https://blog.codinghorror.com/the-principle-of-least-power/).

Here is a glimpse of what's inside :

## UI Toolkit

Most of the files in this repository are standalone javascript and css modules/utilities.

- `fabric/type` contain type manipulation modules (think lodash)
- `fabric/dom` contain element manipulation modules (think jQuery)
- `ui` contain a UI Framework (think Vue.js)
- [...]

## UI Framework

Using the `ui` function is like declaring HTML using JSON.

We're not proud to re-invent HTML markup, but JavaScript is not DX friendly for making HTML elements.

And in the context of a Fantasy OS like windows93, that type of declaration could be safer if 3rd party apps can't execute JavaScript without user permission (because app can be made using JSON, not JavaScript functions or HTML with XSS).

[...]

## UI Components

All our UI components are written using Web Components technologies.
You can declare most components using 3 way.

Using an html tag

```html
<ui-picto value="puzzle" tooltip="Modules"></ui-picto>
```

Using a factory function

```js
picto("puzzle", { tooltip: "Modules" })
```

Using the `ui` function

```js
ui({ tag: "ui-picto", value: "puzzle", tooltip: "Modules" })
```

[...]

## Project Philosophies

### Desktop First

_Desktop First_ means it's not designed as many UI components made for websites and mobile apps.
The main goal here is to make something close to GTK/Qt for HTML.
In the same way the term _Mobile First_ also implies that you can make desktop apps with it, we're trying to make all our components inclusives for any users and devices.

### Inclusive Design

To make it short _[Inclusive Design](https://24ways.org/2016/what-the-heck-is-inclusive-design/)_ is a term combining web accessibility and responsive design.
We tried to follow good practices and semantic markup to help every users.
Thoses who use small screens, touch devices, screen readers, stylus, gamepads, MIDI controllers...
(The only ones we don't think about are [Safari users](https://issafarithenewie.com/)).

## Tomorrow is teh future

The project is still in an experimental phase, here are the current list of priorities, the order should change with maturity.

- DX (developer experience) with consistant API and function naming/signature
- DRY and modularity
- Inclusive Design (UX, a11y...)
- Lightweight
- Security
- Performance

> 🐬 Totally suitable for use in production. Trust me... im a dolphin. <sup><a href="#a1">[1]</a></sup>

## Contributing

Any help is welcome, be aware that the project is still young and things can change without notice.

There is currently a lot of `TODO` comments, if you are looking for something to start.

For new features, we'll appreciate if you provide unit tests and respect the project's philosophy and coding style.

Also, please, before submiting a bug, note that we're currently only supporting latest Node, Firefox and Chrome.

- There is plans for testing compatibility with older Firefox and Chrome.
- There is plans for testing compatibility with Deno and Electron.
- There is no plans for testing compatibility with Safari.

## Code of Conduct

We are not on windows93's trollbox here, so like in any public project: No insults, disrespect or provocative material of any kind will be tolerated in any interactions here (commit message, issues, comments...).
(And yes, even when "it's funny", "for roleplaying" or "just for trolling").

## Sources

As we wanted to gather together most tools possible for making desktop-like applications, that project _MAY_ include some copy-pasted code.

For consistant naming and API we refactored (and sometimes improved) many usefull scripts and styles from npm, github, stackoverflow, blogs and books.

> Some original API were too good and didn't need any changes. We did some rewrite from scratch when original scripts didn't fit well our codebase, either because original implementation was too big, too old (no ES modules) or not specific enough. \
> While doing that, an habit emmerged: STDD (Stolen Test Driven Development).

Many thanks to all authors who shared that knowledge! We tried to mention licences and credits as much as possible, but please contact us if you think we forgot you or if you disagree with licence usage.

We know it's far from a perfect solution when considering open source contribution.
But the project modularity nature is a bit too much entangled to use most existing 3rd party modules.

## How to use

[...]

<pre id="a1" style="font-size: 70%; line-height:1.2;">
[1] sys42 is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY. Without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the License for more details.
</pre>
