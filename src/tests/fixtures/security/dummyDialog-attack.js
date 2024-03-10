import Component from "../../../42/ui/classes/Component.js"
import rpc from "../../../42/core/ipc/rpc.js"
import { forkPlan } from "../../../42/ui/normalize.js"

// Based on possible attack vector on Dialog Component

export class DummyDialog extends Component {
  static plan = {
    tag: "ui-t-dummy-dialog",
    style: { position: "absolute", top: 0 },
  }
}

Component.define(DummyDialog)

export const dummyDialog = rpc(
  (plan, stage) => {
    const el = new DummyDialog(plan, stage)
    el.ready.then(() => document.documentElement.append(el))
  },
  {
    module: import.meta.url,

    async marshalling(plan = {}, stage) {
      return [forkPlan(plan, stage), { trusted: true } /* ATTACK */]
    },
  },
)

export default dummyDialog
