import test from "../../../../42/test.js"
import Database from "../../../../42/core/db/Database.js"

test.suite.serial()

const file = new File(["hello file"], "a/b.txt", {
  type: "text/html",
})

const users = {
  misato: {
    name: "Misato Katsuragi",
    role: "major",
  },
  rei: {
    name: "Rei Ayanami",
    number: 1,
    role: "pilot",
  },
  asuka: {
    name: "Asuka Langley Soryu",
    number: 2,
    role: "pilot",
  },
  shinji: {
    name: "Shinji Ikari",
    number: 3,
    role: "pilot",
  },
}

let db

const testDatabases = ["42-test-db-Nerv"]

function cleanDB(name) {
  testDatabases.push(name)
  return name
}

test.setup(async () => {
  db = new Database({
    name: "42-test-db-Nerv",
    version: Date.now(),
    stores: {
      users: {
        id: {
          autoIncrement: true,
        },
        name: {
          type: "string",
          unique: false,
        },
        number: {
          type: "integer",
          unique: true,
        },
        role: {
          type: "string",
          unique: false,
        },
      },

      files: {
        id: {
          autoIncrement: true,
        },
        name: {
          type: "string",
        },
        lastModified: {
          type: "integer",
          unique: false,
        },
        type: {
          type: "string",
          unique: false,
        },
        size: {
          type: "integer",
          unique: false,
        },
      },

      strings: {},
    },
  })

  await Promise.all(Object.values(users).map((x) => db.users.put(x)))
})

test.teardown(() => {
  db?.destroy().catch((err) => {
    console.warn(err)
  })

  for (const name of testDatabases) {
    indexedDB.deleteDatabase(name)
  }
})

test("default store with to auto increment", async (t) => {
  const name = cleanDB(`42-test-db-${test.utils.uid()}`)
  const db = new Database(name)
  await db.store.add("hello")
  t.is(await db.store.get(1), "hello")
})

test("add() + get()", async (t) => {
  t.false("store" in db, "no default store for database with schema")

  const toji = {
    name: "Toji Suzuhara",
    number: 4,
    role: "pilot",
  }
  const id = await db.users.add(toji)
  t.eq(id, 5)
  t.eq(await db.users.get(id), toji)
  t.eq(await db.users.key(db.range.bound(2, id)), 2)
  t.eq(await db.users.getAllKeys(db.range.bound(2, id)), [2, 3, 4, 5])
  t.eq(await db.users.keys(), [1, 2, 3, 4, 5])
  t.eq(await db.users.index("role").count("major"), 1)
  t.eq(await db.users.index("role").count("pilot"), 4)
})

test.serial("delete()", async (t) => {
  t.is(await db.users.delete(5), undefined)
  t.is(await db.users.get(5), undefined)
  t.eq(await db.users.index("role").count("pilot"), 3)
})

test.serial("update()", async (t) => {
  t.eq(await db.users.update(1, { role: "captain" }), 1)
  t.eq(await db.users.get(1), { name: "Misato Katsuragi", role: "captain" })
  t.eq(users.misato, { name: "Misato Katsuragi", role: "major" })
})

test.serial("update()", 2, async (t) => {
  const newValue = {
    name: "Asuka Shikinami Langley",
    number: 2,
    role: "pilot",
  }
  t.eq(await db.users.update(3, newValue), 3)
  t.eq(await db.users.get(3), newValue)
  t.eq(users.asuka, { name: "Asuka Langley Soryu", number: 2, role: "pilot" })
})

test("throw on not cloneable objects", async (t) => {
  await t.throws(() => db.users.replace(2, location))
  t.eq(await db.users.get(2), users.rei)
})

test("index()", async (t) => {
  t.eq(await db.users.get(2), users.rei)
  t.eq(await db.users.index("number").get(1), users.rei)
  t.eq(await db.users.index("name").get("Shinji Ikari"), users.shinji)
  t.eq(await db.users.get(4), users.shinji)
})

test("has()", async (t) => {
  t.eq(await db.users.index("name").has("Shinji Ikari"), true)
  t.eq(await db.users.index("name").has("Mari Makinami Illustrious"), false)
})

test("find()", async (t) => {
  t.eq(await db.users.find(({ name }) => name.endsWith("i")), users.misato)
  t.eq(await db.users.find(({ name }) => name.endsWith("x")), undefined)
})

test("find()", "object predicate", async (t) => {
  t.eq(await db.users.find({ name: "Rei Ayanami" }), users.rei)
  t.eq(await db.users.find({ number: /1/ }), users.rei)
  t.eq(await db.users.find({ name: /i$/ }), users.misato)

  t.is(await db.users.find({ derp: true }), undefined)
  t.is(await db.users.find({ name: "Rei" }), undefined)
  t.is(await db.users.find({ name: /x/ }), undefined)
})

test("findKey()", "object predicate", async (t) => {
  t.eq(await db.users.findKey({ name: "Rei Ayanami" }), 2)
  t.eq(await db.users.findKey({ number: /1/ }), 2)
  t.eq(await db.users.findKey({ name: /i$/ }), 1)

  t.is(await db.users.findKey({ derp: true }), undefined)
  t.is(await db.users.findKey({ name: "Rei" }), undefined)
  t.is(await db.users.findKey({ name: /x/ }), undefined)
})

const { task } = test

test.tasks(
  [
    task({
      fn: () => db.users.filter(({ name }) => name.endsWith("i")),
      res: [users.misato, users.rei, users.shinji],
    }),
    task({
      fn: () => db.users.filter(({ name }) => name.endsWith("x")),
      res: [],
    }),
    task({
      fn: () => db.users.filter({ name: /i$/ }),
      res: [users.misato, users.rei, users.shinji],
    }),
    task({ fn: () => db.users.filter({ name: /x$/ }), res: [] }),
    task({
      fn: () => db.users.filter({ number: /(1|3)/ }),
      res: [users.rei, users.shinji],
    }),
    task({ fn: () => db.users.filter({ number: 3 }), res: [users.shinji] }),
    task({ fn: () => db.users.filter({ number: 6 }), res: [] }),

    task({ fn: () => db.users.filterKeys({ name: /i$/ }), res: [1, 2, 4] }),
    task({ fn: () => db.users.filterKeys({ number: /(1|3)/ }), res: [2, 4] }),
    task({ fn: () => db.users.filterKeys({ number: 3 }), res: [4] }),

    task({ fn: () => db.users.filterKeys({ name: /x$/ }), res: [] }),
    task({ fn: () => db.users.filterKeys({ number: 6 }), res: [] }),

    task({
      fn: () => db.users.keys(),
      res: [1, 2, 3, 4, 5],
    }),
    task({
      fn: () => db.users.keys({ direction: "prev" }),
      res: [5, 4, 3, 2, 1],
    }),
    task({
      fn: () => db.users.keys({ query: db.range.lowerBound(3) }),
      res: [3, 4, 5],
    }),
    task({
      fn: () => db.users.values(),
      res: [
        { name: "Misato Katsuragi", role: "major" },
        { name: "Rei Ayanami", number: 1, role: "pilot" },
        { name: "Asuka Langley Soryu", number: 2, role: "pilot" },
        { name: "Shinji Ikari", number: 3, role: "pilot" },
        { name: "Toji Suzuhara", number: 4, role: "pilot" },
      ],
    }),
    task({
      fn: () => db.users.entries(),
      res: [
        [1, { name: "Misato Katsuragi", role: "major" }],
        [2, { name: "Rei Ayanami", number: 1, role: "pilot" }],
        [3, { name: "Asuka Langley Soryu", number: 2, role: "pilot" }],
        [4, { name: "Shinji Ikari", number: 3, role: "pilot" }],
        [5, { name: "Toji Suzuhara", number: 4, role: "pilot" }],
      ],
    }),
  ],

  (test, { title, fn, res }) => {
    title ??= fn.toString().replace(/^\(\) => /, "")

    test(title, "promise", async (t) => {
      t.eq(await fn(), res)
    })

    test(title, "iterator", async (t) => {
      const items = []
      for await (const item of fn()) items.push(item)
      t.eq(items, res, "unexepected iterator")
    })
  },
)

test("interupted transaction", async (t) => {
  const items = []

  for await (const item of db.users.filter({ name: /i$/ })) {
    await t.sleep(1)
    items.push(item)
  }

  t.eq(items, [users.misato, users.rei, users.shinji])
})

test("interupted transaction", "direction:prev", async (t) => {
  const items = []

  for await (const item of db.users.filter(
    { direction: "prev" },
    { name: /i$/ },
  )) {
    await t.sleep(1)
    items.push(item)
  }

  t.eq(items, [users.shinji, users.rei, users.misato])
})

test("strings", async (t) => {
  const id = await db.strings.set("hello", "world")
  t.is(id, "hello")
  t.is(await db.strings.get(id), "world")

  await t.throws(() => db.strings.find({ id: "hello" }), {
    message: "Predicate object only work with object values",
  })
})

test("fromEntries", async (t) => {
  await db.strings.fromEntries(
    Object.entries({
      a: "A",
      b: "B",
      c: "C",
      d: "D",
    }),
  )
  t.is(await db.strings.get("a"), "A")
  t.is(await db.strings.get("d"), "D")
})

test("files", async (t) => {
  const res = await db.files
    .put(file)
    .then((id) => db.files.get(id))
    .then((file) => file.text())

  t.is(res, "hello file")
})

test("do not make store shortcuts on existing Database properties", async (t) => {
  const db = new Database(cleanDB(`42-test-db-${test.utils.uid()}`), {
    version: Date.now(),
    stores: { range: {} },
  })
  t.not(db.stores.range, undefined)
  t.is(db.range, IDBKeyRange)
  await db.destroy()
})

test("obsolete instance", async (t) => {
  const name = cleanDB(`42-test-db-${test.utils.uid()}`)

  const db1 = new Database(name, {
    version: 1,
  })

  await db1.init()

  const db2 = new Database(name, {
    version: 2,
  })

  await db2.init()

  await t.throws(() => db1.init(), {
    name: "DatabaseError",
    message: "Database is obsolete",
  })
})

test("auto downgrade", async (t) => {
  const name = cleanDB(`42-test-db-${test.utils.uid()}`)

  const db1 = new Database(name, {
    version: 2,
  })

  await db1.init()

  const db2 = new Database(name, {
    version: 1,
  })

  await t.notThrows(() => db2.init())

  await t.throws(() => db1.init(), {
    name: "DatabaseError",
    message: "Database is obsolete",
  })
})

// TODO: test database migration
// @read https://stackoverflow.com/a/21078740
// @read https://www.w3.org/TR/IndexedDB/#introduction
