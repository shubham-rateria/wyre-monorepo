export default (type: any) => {
  if (
    type === "bigint" ||
    type === "boolean" ||
    type === "number" ||
    type === "string"
  ) {
    return true;
  }
};
