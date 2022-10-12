export default function appCard(manifest) {
  return {
    tag: ".box-v.mb-xl",
    content: [
      { tag: "img.checkboard.inset", src: "{{icons/2/src}}" },
      {
        tag: ".pa",
        content: [
          { tag: "h1.mt-0", content: "{{name}}" },
          { tag: "p.mt-0", content: "{{description}}" },
          {
            tag: "ul.unstyled.d-flex.gap-sm",
            content: {
              scope: "categories",
              each: {
                tag: "li.pill",
                content: "{{titleCase(.)}}",
              },
            },
          },
        ],
      },
    ],
    state: manifest,
  }
}
