const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");

const TimeScalar = new GraphQLScalarType({
  name: "Time",
  description: "ISO 8601 formatted time string",
  serialize(value) {
    return value.toISOString(); // Convert Date object to ISO string
  },
  parseValue(value) {
    return new Date(value); // Parse ISO string to Date object
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value); // Parse string literal to Date object
    }
    return null; // Invalid scalar value
  },
});

module.exports = TimeScalar;
