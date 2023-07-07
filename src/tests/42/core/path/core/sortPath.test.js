import test from "../../../../../42/test.js"
import sortPath from "../../../../../42/core/path/core/sortPath.js"

const { task } = test

test.tasks(
  [
    task({
      unsorted: [
        "a.txt", //
        "a/b/d.txt",
        "x/y.txt",
        "a/b.txt",
        "a/b/c.txt",
      ],
      expected: [
        "a/b/c.txt", //
        "a/b/d.txt",
        "a/b.txt",
        "x/y.txt",
        "a.txt",
      ],
    }),

    task({
      unsorted: [
        "/hello.txt", //
        "/a/",
        "/a/b.js",
        "/a/c.css",
        "/x/",
      ],
      expected: [
        "/a/", //
        "/a/b.js",
        "/a/c.css",
        "/x/",
        "/hello.txt",
      ],
    }),

    task({
      // @src https://github.com/ghornich/sort-paths/blob/master/test.js
      unsorted: [
        "/home/joe/",
        "/var/www/beta-site/core/pages/login.cgi",
        "/home/joe/images/25-11.jpeg",
        "/var/www/test.php",
        "/home/joe/images/",
        "/",
        "/home/joe/quotes.txt",
        "/bin/",
        "/bin/",
      ],
      expected: [
        "/",
        "/bin/",
        "/bin/",
        "/home/joe/",
        "/home/joe/images/",
        "/home/joe/images/25-11.jpeg",
        "/home/joe/quotes.txt",
        "/var/www/beta-site/core/pages/login.cgi",
        "/var/www/test.php",
      ],
    }),
  ],

  (test, { unsorted, expected }) => {
    test(unsorted, (t) => {
      t.eq(sortPath(unsorted), expected)
    })
  },
)
