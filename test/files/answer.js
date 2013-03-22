(function (computer) {
  return computer(42);
}(function (value) { return value.toString(); }));