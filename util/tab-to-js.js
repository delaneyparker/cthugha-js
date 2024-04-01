const fs = require('fs');

function convertByteArrayToIntArray(byteArray) {
  const intArray = [];
  for (let i = 0; i < byteArray.length; i += 2) {
    const value = byteArray[i] | (byteArray[i + 1] << 8);
    intArray.push(value);
  }
  return intArray;
}

function convertTabToJs(inputFile, outputFile) {
  const tabBuffer = fs.readFileSync(inputFile);
  const intArray = Array.from(convertByteArrayToIntArray(new Uint8Array(tabBuffer)));

  // Save the byteArray to a .js or .ts file that can be imported
  const jsContent = `export const tabData = ${JSON.stringify(intArray)};`;
  fs.writeFileSync(outputFile, jsContent);
}

// TODO: Grab input and output files from the command line
// const inputFiles = ["cthugha/ROTATE.TAB", "cthugha/HURR.TAB", "cthugha/SPIR-OUT.TAB", "cthugha/VORTEX.TAB", "cthugha/YIN-YANG.TAB"];
// const outputFiles = ["src/tabs/rotate.js", "src/tabs/hurr.js", "src/tabs/spir-out.js", "src/tabs/vortex.js", "src/tabs/yin-yang.js"];
const inputFiles = ["SPIR-OUT.TAB", "VORTEX.TAB"];
const outputFiles = ["src/tabs/spir-out.js", "src/tabs/vortex.js"];

for (let i = 0; i < inputFiles.length; i++) {
  const inputFile = inputFiles[i];
  const outputFile = outputFiles[i];
  convertTabToJs(inputFile, outputFile);
}
