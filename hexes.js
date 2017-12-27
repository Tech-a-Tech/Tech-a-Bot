const invert = require("invert-color");
function generate() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

async function invertColor(color) {
  try {
    return invert(color);
  } catch (err) {
    throw new TypeError("Invalid color.");
  }
}

module.exports = { generate, invertColor }
