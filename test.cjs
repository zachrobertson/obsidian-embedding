const svdTs = require("./svd.cjs");
const svdJs = require("./svd_test.cjs");

const mathjs = require("mathjs");

// Input matrix
const a = [
    [4, 11, 14], 
    [5, 6, 7],
    [8, 9, 10],
    [11, 12, 13]
];

// Run both functions
console.log(svdTs);
console.log(svdJs);
const resultTs = svdTs.svd(mathjs.matrix(a));
const resultJs = svdJs.default(a);

// Check if the outputs are equal
const areEqual = JSON.stringify(resultTs) === JSON.stringify(resultJs);
const fs = require('fs');

// Create an object to store the results
const output = {
    resultTs: resultTs,
    resultJs: resultJs,
    areEqual: areEqual
};

// Convert the object into JSON string
const data = JSON.stringify(output, null, 2);

// Write the JSON string to a file
fs.writeFile('test_output.json', data, (err) => {
    if (err) {
        throw err;
    }
    console.log("JSON data is saved.");
});


console.log(`The outputs are ${areEqual ? 'equal' : 'not equal'}`);