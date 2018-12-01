import {TypeObject, TSchema, SchemaReference, ValueOfType, SingleType} from './types';

type subtype<A, B> = A extends B ? true : false;

function valid<T extends keyof E, E extends TSchema, V>(
  type: T,
  value: V,
  env: E
): and<subtype<V, SchemaReference<T, E>>, subtype<E, Record<string, TypeObject<E>>>> {
  throw new Error(String(type) + value + env);
}

type and<A extends boolean, B extends boolean> = A extends true
  ? (B extends true ? true : false)
  : false;

function assertTrue(x: true) {
  throw new Error(String(x));
}
function assertFalse(x: false) {
  throw new Error(String(x));
}

// the following functions are very useful for debugging but commented out to appease TSLint.
// example usage:
//
//
//   const x: ExpectedEnum = schemaReference('testEnum', schemaLib);
//
// TypeScript gives an error about how `SchemaReference` does not match `ExpectedEnum` precisely
// **because** the types are eq

function schemaReference<k extends keyof E, E extends TSchema>(
  type: k,
  env: E
): SchemaReference<k, E> {
  throw new Error(String(type) + env);
}
function valueOfType<t extends SingleType>(type: t): ValueOfType<t> {
  throw new Error(String(type));
}
/*
// occasionally useful for debugging but TSLint is upset that we're not using it in the committed tests:

function subtypeOf<A, B>(sub: A, sup: B): subtype<A, B> {
  throw new Error(String(sub) + sup);
}
*/
function typeEq<A, B>(a: A, b: B): and<subtype<A, B>, subtype<B, A>> {
  throw new Error(String(a) + b);
}

const tNum = {type: 'number' as 'number'};
const tUnit = {type: 'unit' as 'unit'};
const tText = {type: 'text' as 'text'};

const schemaLib = {
  testUndefined: tUnit,
  testNumber: tNum,
  testString: tText,
  testMaybeString: {type: 'maybe' as 'maybe', meta: tText},
  testObject: {type: 'object' as 'object', meta: {abc: tUnit, def: tNum, ghi: tText}},
  testEnum: {
    type: 'enum' as 'enum',
    meta: {abc: tUnit, def: tNum, ghi: tText},
    typeKey: 'type' as 'type',
    valueKey: 'value' as 'value'
  }
};

assertTrue(typeEq(valueOfType(tUnit), undefined as undefined));
assertTrue(typeEq(schemaReference('testUndefined', schemaLib), undefined as undefined));
assertTrue(valid('testUndefined', undefined, schemaLib));
assertFalse(valid('testUndefined', null, schemaLib));
assertFalse(valid('testUndefined', 123, schemaLib));
assertFalse(valid('testUndefined', 'abc', schemaLib));

assertTrue(typeEq(valueOfType(tNum), 123));
assertTrue(typeEq(schemaReference('testNumber', schemaLib), 123 as number));
assertTrue(valid('testNumber', 123, schemaLib));
assertFalse(valid('testNumber', 'abc', schemaLib));
assertFalse(valid('testNumber', null, schemaLib));
assertFalse(valid('testNumber', undefined, schemaLib));

assertTrue(typeEq(valueOfType(tText), 'abc'));
assertTrue(typeEq(schemaReference('testString', schemaLib), 'abc' as string));
assertTrue(valid('testString', 'abc', schemaLib));
assertFalse(valid('testString', 123, schemaLib));
assertFalse(valid('testString', null, schemaLib));
assertFalse(valid('testString', undefined, schemaLib));

assertTrue(
  typeEq(valueOfType({type: 'maybe' as 'maybe', meta: {type: 'number'}}), 123 as null | number)
);
assertTrue(typeEq(schemaReference('testMaybeString', schemaLib), null as null | string));
assertTrue(valid('testMaybeString', 'abc', schemaLib));
assertTrue(valid('testMaybeString', null, schemaLib));
assertFalse(valid('testMaybeString', 123, schemaLib));
assertFalse(valid('testMaybeString', undefined, schemaLib));

assertTrue(
  typeEq(schemaReference('testObject', schemaLib), {abc: undefined, def: 123, ghi: 'abc'})
);
assertFalse(valid('testObject', {def: 123, ghi: 'abc'}, schemaLib));

type ExpectedEnum =
  | {type: 'abc'; value: undefined}
  | {type: 'def'; value: number}
  | {type: 'ghi'; value: string};

assertTrue(
  typeEq(schemaReference('testEnum', schemaLib), {type: 'abc', value: undefined} as ExpectedEnum)
);
assertFalse(valid('testEnum', {type: 'abc' as 'abc'}, schemaLib));

// test basic recursion
const stringStack = {
  item: {type: 'text' as 'text'},
  cell: {
    type: 'maybe' as 'maybe',
    meta: {
      type: 'object' as 'object',
      meta: {
        first: {type: 'ref' as 'ref', to: 'item' as 'item'},
        rest: {type: 'ref' as 'ref', to: 'cell' as 'cell'}
      }
    }
  }
};

const testStack = {first: 'abc', rest: {first: 'def', rest: {first: 'ghi', rest: null}}}
assertTrue(valid('cell' as 'cell', testStack, stringStack));
assertTrue(valid('cell' as 'cell', {first: 'abc', rest: null}, stringStack));
assertTrue(valid('cell' as 'cell', null, stringStack));
assertFalse(valid('cell' as 'cell', {}, stringStack));
assertFalse(valid('cell' as 'cell', {first: ''}, stringStack));
assertFalse(valid('cell' as 'cell', {first: 123, rest: null}, stringStack));
assertFalse(valid('cell' as 'cell', undefined, stringStack));

const badRef = {
  cell: {
    type: 'maybe' as 'maybe',
    meta: {
      type: 'object' as 'object',
      meta: {
        first: {type: 'ref' as 'ref', to: 'item' as 'item'},
        rest: {type: 'ref' as 'ref', to: 'cell' as 'cell'}
      }
    }
  }
}
assertFalse(valid('cell' as 'cell', testStack, badRef));
