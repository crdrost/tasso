import * as tasso from './helpers';

const refs = tasso.refs<'singleSchema' | 'props'>();
const metaschema = {
  singleSchema: tasso.choice({
    unit: {},
    bool: {},
    number: {integer: tasso.maybe(tasso.bool)},
    text: {},
    object: {properties: refs.props},
    choice: {typeKey: tasso.text, options: tasso.dict(refs.props)},
    ref: {to: tasso.text},
    list: {elements: refs.singleSchema},
    dict: {elements: refs.singleSchema},
    union: {first: refs.singleSchema, second: refs.singleSchema}
  }),
  props: tasso.dict(refs.singleSchema)
};

export default metaschema;
