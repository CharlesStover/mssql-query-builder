export type Aliases = { [alias: string]: string };

const getAliases = (str: string): Aliases => {

  // Loop each character.
  const aliases: Aliases = {};
  let expressions: string = str;
  let openParentheses = 0;
  let openQuote = '';
  for (let x = 0; x <= expressions.length; ++x) {
    const char: string = expressions.charAt(x);
    switch (char) {

      // Ignore anything while quotes are open.
      case '\'':
      case '"':
        if (
          x === 0 ||
          expressions.charAt(x - 1) !== '\\'
        ) {
          if (openQuote === char) {
            openQuote = '';
          }
          else if (openQuote === '') {
            openQuote = char;
          }
        }
        break;

      // Ignore parameters of functions.
      case '(':
        if (openQuote === '') {
          ++openParentheses;
        }
        break;
      case ')':
        if (openQuote === '') {
          --openParentheses;
        }
        break;

      // Find expression delimeters.
      // Find the " AS " in "expression AS alias"
      case ',':
      case ' ':
      case '':
        if (
          openParentheses === 0 &&
          openQuote === ''
        ) {

          // Expression delimeter.
          if (
            char === ',' ||
            char === ''
          ) {

            // Add this expression to the SELECT clause
            const expression: string = expressions.substring(0, x).trim();
            aliases[expression] = expression;

            // Reset the expression finder.
            expressions = expressions.substring(x + 1);
            x = 0;
          }

          // Expression alias.
          else if (expressions.substring(x, x + 4).toUpperCase() === ' AS ') {

            // Add this expression to the SELECT clause.
            const expression: null | RegExpMatchArray = expressions.substring(x + 4).match(/^\s*(?:\"([^\"]*)\"|([\w\d]+))/i);
            if (expression) {
              const alias: string = expression[1] || expression[2];
              aliases[alias] = expressions.substring(0, x).trim();

              // Reset the expression finder.
              expressions = expressions.substring(x + 4 + alias.length + (expression[1] ? 2 : 0)).replace(/^\s*\,\s*/, '');
              x = 0;
            }
            else {
              console.error(expressions);
              throw new Error('Invalid column alias detected.');
            }
          }
        }
        break;
    }
  }
  return aliases;
};

export default getAliases;
