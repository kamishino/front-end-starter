export const convertCase = (str, toCase = "camel") => {
  if (!str) return ""

  const delimiter = toCase === "snake" ? "_" : toCase === "kebab" ? "-" : ["title", "sentence"].includes(toCase) ? " " : ""

  const transform = ["camel", "pascal"].includes(toCase)
    ? (x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase()
    : ["snake", "kebab"].includes(toCase)
      ? (x) => x.toLowerCase()
      : toCase === "title"
        ? (x) => x.slice(0, 1).toUpperCase() + x.slice(1)
        : (x) => x

  const finalTransform =
    toCase === "camel"
      ? (x) => x.slice(0, 1).toLowerCase() + x.slice(1)
      : toCase === "sentence"
        ? (x) => x.slice(0, 1).toUpperCase() + x.slice(1)
        : (x) => x

  const words = str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)

  return finalTransform(words.map(transform).join(delimiter))
}
