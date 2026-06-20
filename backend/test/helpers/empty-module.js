// test/helpers/empty-module.js
// Placeholder module that stands in for the PhonePe SDK tarball
// (which has non-standard package.json exports and fails to resolve
// in Vite's import-analysis step). Anything that imports
// `pg-sdk-node` will get an empty object.
export default {};
