import test from "../../../../42/test.js"
import argv from "../../../../42/os/cli/argv.js"
import parseCommand from "../../../../42/os/cli/parseCommand.js"

import configure from "../../../../42/fabric/configure.js"
export const PRESETS = {
  verbose: {
    schema: { verbose: { type: "number" } },
    count: ["verbose"],
    globalOptions: ["silent"],
    aliases: { v: "verbose", s: "silent" },
    presets: { silent: { verbose: 0 } },
  },
}

/*
@read https://www.gnu.org/software/libc/manual/html_node/Argument-Syntax.html

POSIX recommends these conventions for command line arguments.

- Arguments are options if they begin with a hyphen delimiter (‘-’).
- Multiple options may follow a hyphen delimiter in a single token
  if the options do not take arguments. Thus, ‘-abc’ is equivalent to ‘-a -b -c’.
- Option names are single alphanumeric characters
  (as for isalnum; see Classification of Characters).
- Certain options require an argument.
  For example, the ‘-o’ command of the ld command requires an argument—an output file name.
- An option and its argument may or may not appear as separate tokens.
  (In other words, the whitespace separating them is optional.)
  Thus, ‘-o foo’ and ‘-ofoo’ are equivalent.
- Options typically precede other non-option arguments.

  The implementations of getopt and argp_parse in the GNU C Library
  normally make it appear as if all the option arguments were specified
  before all the non-option arguments for the purposes of parsing,
  even if the user of your program intermixed option and non-option arguments.
  They do this by reordering the elements of the argv array.
  This behavior is nonstandard; if you want to suppress it,
  define the _POSIX_OPTION_ORDER environment variable. See Standard Environment.

- The argument ‘--’ terminates all options;
  any following arguments are treated as non-option arguments,
  even if they begin with a hyphen.
- A token consisting of a single hyphen character is interpreted as an
  ordinary non-option argument. By convention, it is used to specify
  input from or output to the standard input and output streams.
- Options may be supplied in any order, or appear multiple times.
  The interpretation is left up to the particular application program.

GNU adds long options to these conventions.
Long options consist of ‘--’ followed by a name made of
alphanumeric characters and dashes. Option names are typically
one to three words long, with hyphens to separate words.
Users can abbreviate the option names as long as the abbreviations are unique.

To specify an argument for a long option, write ‘--name=value’.
This syntax enables a long option to accept an argument that is itself optional.

Eventually, GNU systems will provide completion for long option names in the shell.
*/

test.tasks(
  [
    {
      input: "1 2 -a b c -def",
      expected: {
        _: [1, 2],
        a: ["b", "c"],
        d: true,
        e: true,
        f: true,
      },
    },

    {
      title: "autoBoolean: false",
      input: "1 2 -a b c -def",
      options: {
        autoBoolean: false,
      },
      expected: {
        _: [1, 2],
        a: ["b", "c"],
        d: undefined,
        e: undefined,
        f: undefined,
      },
    },

    {
      input: "undefined -a undefined",
      expected: {
        _: [undefined],
        a: undefined,
      },
    },

    {
      input: "--abc=123 --def= --no-g --no-h=789",
      expected: {
        "abc": 123,
        "def": "",
        "g": false,
        "no-h": 789,
      },
    },

    {
      input: `--aaa='{"a":1}' --aa={a:1} -b [2,3] -c [;] 5 -d null`,
      expected: {
        aaa: { a: 1 },
        aa: "{a:1}",
        b: [2, 3],
        c: ["[;]", 5],
        d: null,
      },
    },

    {
      input: "-a b -- -a 1 [2] --c=d",
      expected: {
        _: ["-a", 1, [2], "--c=d"],
        a: "b",
      },
    },

    {
      input: "-a.b 1 --a.c.d 2 --foo.bar 3",
      expected: {
        a: { b: 1, c: { d: 2 } },
        foo: { bar: 3 },
      },
    },

    {
      input: "x -b y",
      options: {
        schema: {
          b: { type: "boolean" },
        },
      },
      expected: {
        _: ["x", "y"],
        b: true,
      },
    },

    {
      input: "x -b y",
      options: {
        schema: {
          bool: { type: "boolean" },
        },
        aliases: {
          b: "bool",
        },
      },
      expected: {
        _: ["x", "y"],
        bool: true,
      },
    },

    {
      input: "x --no-b y",
      options: {
        schema: {
          b: { type: "boolean" },
        },
      },
      expected: {
        _: ["x", "y"],
        b: false,
      },
    },

    {
      input: "-aaa --foo --foo",
      options: {
        count: ["a", "foo"],
      },
      expected: {
        a: 3,
        foo: 2,
      },
    },

    {
      input: "-v",
      options: {
        aliases: { v: "verbose" },
      },
      expected: {
        verbose: true,
      },
    },

    {
      input: ["-vvv", "--verbose --verbose --verbose"],
      options: {
        count: ["verbose"],
        aliases: { v: "verbose" },
      },
      expected: {
        verbose: 3,
      },
    },

    {
      input: "-s",
      options: {
        aliases: { v: "verbose", s: "silent" },
        presets: { silent: { verbose: 0 } },
      },
      expected: {
        verbose: 0,
      },
    },

    {
      input: "-v a",
      options: {
        schema: { verbose: { type: "number" } },
        count: ["verbose"],
        aliases: { v: "verbose" },
      },
      expected: {
        _: ["a"],
        verbose: 1,
      },
    },

    {
      title: "typesDefaults: true",
      input: "-a -b -i -n -o -s --null",
      options: {
        schema: {
          a: { type: "array" },
          b: { type: "boolean" },
          i: { type: "integer" },
          n: { type: "number" },
          o: { type: "object" },
          s: { type: "string" },
          null: { type: "null" },
        },
      },
      expected: {
        a: [],
        b: true,
        i: 0,
        n: 0,
        o: {},
        s: "",
        null: null,
      },
    },

    {
      title: "typesDefaults: false",
      input: "-a -b -i -n -o -s --null",
      options: {
        typesDefaults: false,
        validate: false,
        schema: {
          a: { type: "array" },
          b: { type: "boolean" },
          i: { type: "integer" },
          n: { type: "number" },
          o: { type: "object" },
          s: { type: "string" },
          null: { type: "null" },
        },
      },
      expected: {
        a: true,
        b: true,
        i: true,
        n: true,
        o: true,
        s: true,
        null: true,
      },
    },

    {
      title: "emptyInput:true",
      input: "-a",
      options: {
        emptyArgs: true,
      },
      expected: {
        _: [],
        a: true,
      },
    },

    {
      title: "emptyInput:true with subcommands",
      input: "-a cmd -b",
      options: {
        emptyArgs: true,
        subcommands: ["cmd"],
      },
      expected: {
        _: [],
        a: true,
        cmd: { _: [], b: true },
      },
    },

    {
      input: "test a --verbose watch b -s serve c --port 3000",
      options: {
        subcommands: ["test", "watch", "serve"],
      },
      expected: {
        test: { _: ["a"], verbose: true },
        watch: { _: ["b"], s: true },
        serve: { _: ["c"], port: 3000 },
      },
    },

    {
      input: "test --verbose watch -s serve --port 3000 watch 2",
      options: {
        subcommands: {
          "a": ["test", "watch"],
          "b.x": ["watch"],
          "b.y": ["serve"],
        },
      },
      expected: {
        a: { test: { verbose: true } },
        b: {
          x: { watch: { _: [2], s: true } },
          y: { serve: { port: 3000 } },
        },
      },
    },

    {
      input: "-a test **/* --verbose watch -s serve --port 3000 -vvv --dev",
      options: {
        aliases: { v: "verbose", s: "silent" },
        presets: { silent: { verbose: 0 } },
        count: ["verbose"],
        globalOptions: ["dev"],
        subcommands: {
          tasks: ["test", "watch", "serve"],
        },
        argsKey: "glob",
      },
      expected: {
        a: true,
        tasks: {
          test: { glob: ["**/*"], verbose: 1 },
          watch: { verbose: 0 },
          serve: { port: 3000, verbose: 3 },
        },
        dev: true,
      },
    },

    {
      input: "-a test **/* --verbose watch -s serve --port 3000 -vvv --dev",
      options: configure(PRESETS.verbose, {
        globalOptions: ["dev"],
        subcommands: {
          tasks: ["test", "watch", "serve"],
        },
        argsKey: "glob",
      }),
      expected: {
        a: true,
        tasks: {
          test: { glob: ["**/*"], verbose: 1 },
          watch: { verbose: 0 },
          serve: { port: 3000, verbose: 3 },
        },
        dev: true,
      },
    },
  ],

  ({ title, input, expected, options }) => {
    for (const cmd of Array.isArray(input) ? input : [input]) {
      test(title ?? cmd, (t) => {
        const parsed = parseCommand(cmd)
        t.eq(argv(parsed, options), expected)
      })
    }
  }
)
