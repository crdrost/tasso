import {IReference, SchemaReference, ValueOfSingleType} from '../types';
import {
  ref,
  object,
  unit,
  num,
  text,
  chooser,
  choice,
  union,
  maybe,
  list,
  dict,
  bool
} from '../helpers';

// So just as a heads up to folks reading this, a lot of these tests are compile-time, where we are
// just making sure that we can assign a value to a ValueOfSingleType<tso> in Typescript way before
// the test suite is actually running. TSLint then demands that we use the values so we add an extra
// layer of using these examples to make sure that the structure is roughly what we expected.

test('basic structure of refs', () => {
  const y: IReference<{def: {type: 'unit'}}> = ref('def');
  expect(y).toEqual({type: 'ref', to: 'def'});
  expect(ref('abc')).toEqual({type: 'ref', to: 'abc'});
  expect(ref('abc')).toBe(ref('abc'));
});

test('type structure of objects', () => {
  const schema = {
    testObject: object({
      abc: unit,
      def: num,
      ghi: text,
      jkl: bool
    })
  };
  const y: SchemaReference<'testObject', typeof schema> = {
    abc: undefined,
    def: 123,
    ghi: 'num',
    jkl: false
  };

  expect(schema.testObject.properties).toEqual({
    abc: {type: 'unit'},
    def: {type: y.ghi, integer: false}, // to stop tslint complaining that y is unused -- it generates compile errs.
    ghi: {type: 'text'},
    jkl: {type: 'bool'}
  });
});

test('chooser type structure', () => {
  const tso = chooser('target' as 'target')({
    single: {
      targetIndex: num,
      spell: text
    },
    multi: {
      spell: text
    }
  });
  const y: ValueOfSingleType<typeof tso> = {target: 'multi', spell: 'text'};
  expect(tso.options).toEqual({
    single: {targetIndex: {type: 'num', integer: false}, spell: {type: 'text'}},
    multi: {spell: {type: y.spell}}
  });
});

test('choice specifies type-key `type`', () => {
  const tso = choice({abc: {text}});
  const x: ValueOfSingleType<typeof tso> = {type: 'abc', text: 'type'};
  expect(tso.typeKey).toBe(x.text);
});

test('union of two types validates either of them', () => {
  const tso = union(text, object({abc: text}));
  const x: ValueOfSingleType<typeof tso> = {abc: 'text'};
  const y: ValueOfSingleType<typeof tso> = 'abc';
  expect(Object.keys(tso.second.properties)).toEqual([y]);
  expect(tso.first.type).toBe(x.abc);
});

test('union of two types', () => {
  const tso = union(text, object({abc: text}));
  const x: ValueOfSingleType<typeof tso> = {abc: 'type'};
  const y: ValueOfSingleType<typeof tso> = 'type';
  expect(x.abc).toBe(y);
  expect(tso.type).toBe('union');
});

test('maybe helper creates a union of unit and a target type', () => {
  const tso = maybe(object({undefined: text}));
  const x: ValueOfSingleType<typeof tso> = undefined;
  const y: ValueOfSingleType<typeof tso> = {undefined: 'unit'};
  expect(tso.type).toBe('union');
  expect(Object.keys(tso.second.properties)).toEqual([String(x)]);
  expect(tso.first.type).toBe(y.undefined);
});

test('list helper creates a list schema', () => {
  const tso = list(text);
  const x: ValueOfSingleType<typeof tso> = ['elements', 'type'];
  const y: ValueOfSingleType<typeof tso> = [];
  expect(Object.keys(tso).sort()).toEqual(x);
  expect([tso.type].filter(x => x !== 'list')).toEqual(y);
});

test('dict helper creates a dict schema', () => {
  const tso = dict(text);
  const x: ValueOfSingleType<typeof tso> = {type: '"dict"', elements: '{"type":"text"}'};
  const sortedKeys = (obj: object): string[] => Object.keys(obj).sort();
  const sortedVals = (obj: {[k: string]: any}): any[] => sortedKeys(obj).map(k => obj[k]);
  expect(sortedKeys(tso)).toEqual(sortedKeys(x));
  expect(sortedVals(tso)).toEqual(sortedVals(x).map(x => JSON.parse(x)));
});

// union
//maybe
// list
//dict
