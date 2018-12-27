import * as tasso from './helpers';

const metaschema = {
  singleSchema: tasso.choice({
    unit: {},
    bool: {},
    number: {integer: tasso.maybe(tasso.bool)},
    text: {},
    blob: {},
    object: {properties: tasso.ref('props')},
    choice: {typeKey: tasso.text, options: tasso.dict(tasso.ref('props'))},
    ref: {to: tasso.text},
    list: {elements: tasso.ref('singleSchema')},
    dict: {elements: tasso.ref('singleSchema')},
    union: {first: tasso.ref('singleSchema'), second: tasso.ref('singleSchema')}
  }),
  props: tasso.dict(tasso.ref('singleSchema'))
};

export default metaschema;
