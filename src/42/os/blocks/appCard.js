export default function appCard(manifest) {
  return {
    state: manifest,
    tag: "section",
    aria: {
      labelledby: "add-card-label",
      // description: "Instalable Web App",
    },
    content: [
      {
        tag: "div",
        content: [
          {
            tag: "h2#add-card-label.ma-t-0.ma-b-lg.box-h.gap-lg.items-y-center",
            content: [
              {
                if: "{{icons.length}}",
                tag: "img",
                aria: { hidden: true },
                src: "{{icons/1/src ?? icons/0/src}}",
              },
              {
                tag: "div",
                content: "{{name}}",
              },
            ],
          },
          {
            tag: "ul.unstyled.d-flex.gap-sm",
            aria: { label: "Categories" },
            content: {
              scope: "categories",
              each: {
                tag: "li.pill",
                content: "{{titleCase(.)}}",
              },
            },
          },
          {
            if: "{{description}}",
            tag: "p",
            content: "{{description}}",
          },
          {
            if: "{{copyright}}",
            tag: "p.ma-b-0.opacity-half.txt-wrap",
            content: "{{copyright}}",
          },
        ],
      },
    ],
  }
}
