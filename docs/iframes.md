# Iframes as isolated app processes

[...]

The iframe `sandbox` attribute make possible to run an application without access to the top-level realm (and most importantly user storage like localStorage, indexedDB...), so until the [ShadowRealm API](https://github.com/tc39/proposal-shadowrealm) become a thing it's good way to prevent XSS.

The `allow` attribute make possible to control [Feature Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy/Using_Feature_Policy) inside the iframe, so the user can allow or disallow an application's request for an advanced api (like access to the webcam, or even prevent other domain scripts, images...).

Those properties make iframes the perfect candidate to isolate multiple running applications inside a webpage, and making a Fantasy OS like windows93.

But there is some difficulties to overcome when making GUI using iframes:

## Style isolation

That's the simplest one to resolve, add a global stylesheet in every iframe and the job is done.

## Event isolation

If a click/mouseover/keydown event happen in an iframe, the top-level page has no way to know about it.
It could be complex for making global shortcuts, or to close dropdowns/menus if you listen to clicks outside the dropdown to close it.

A solution for making global shortcuts is to include a script in every iframe listening keydown events, and use `postMessage` with our cross realm module [ipc.js](../src/42/core/ipc.js) to let the top-level realm handle it.

For the dropdown example, the solution was to listen to blur event, if the iframe get focus the top-level realm will fire a blur event, so we can close the dropdown.

Another example is drag and drop, that one need a lot of `postMessage` to work, like in [transferable.js](../sys42/src/42/ui/traits/transferable.js).

## Nothing can visually escape the iframe boundaries

Suppose you want your iframed application to open a dialog or a menu, that components will be displayed inside the iframe boundaries.

It could work in many situation, but it often fail to make it feel like a reel desktop environment.
A small application window cannot diplay large menu from it's menubar.
And alerts and settings dialogs could not be larger than that application window (or centered inside the top-level page).

The solution we choose is to make calls to popups, menus and dialog components using [rpc.js](../src/42/core/ipc/rpc.js).

RPC means [Remote Procedure Call](https://en.wikipedia.org/wiki/Remote_procedure_call), it allow to write a function that can execute remotely (in another realm) with the same API and signature as if it were called locally.

Using that method if the application is inside the top-level realm, it will directly execute the function that open the components, and when used inside an iframe it will use `postMessage` to ask the top-level to open the component and send any interaction or change made by the user back to the iframe.

Using that solution implies many convolutions :

- **focus management across realms**
- **data/state transfer**
- **remote function calls**

Using sandboxed iframes it's not allowed to access other realm global object, so again we must use `postMessage` to pass data back and forth.

- **accessibility downgrade**

Many aria attributes like `aria-controls` or `aria-labelledby` expect the id of an element in the same page. Using **RPC** for GUI components make it impossible.
In the case of `aria-labelledby` it can be replaced by `aria-label`, but most other "linked" aria attributes can't be used.

We are guessing that as long as focus is managed correctly from iframe to top-level, that missing attributes are not vital to make the interface inclusive to most users, but feedback from accessibility experts is very welcome about this.

- **increase XSS vector**

`postMessage` and [ipc.js](../src/42/core/ipc.js) are a pretty safe way of sending data from an untrusted origin.
But of course the more we use it, the more we have surface for XSS attacks.
There is already some tests on how to prevent unwanted code injection in the top-level realm in [xss.test.js](../src/tests/42/ui/xss.test.js)

[...]
