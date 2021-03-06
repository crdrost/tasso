/**
 * Some compile-time tests for Tasso, validating that what comes out of the big complicated
 * inferences in `types.ts` is also what we would expect it to be in some real examples.
 *
 * This file does not actually run any code. Its purpose is to statically analyze the types
 * involved. We use the fact that `true` and `false` are subtypes of `boolean` and define functions
 * `assertTrue(x: true): void` and `assertFalse(x: false): void` which throw runtime exceptions if
 * actually run, but which will fail to typecheck if the arguments inside of them are either
 * uncertain (`boolean`) or wrong (`false` when they're supposed to be `true` or vice versa). The
 * rest of this is based on parametric types which infer `true` or `false`, call them "type
 * conditionals".
 */
import {TypeObject, TSchema, SchemaReference, ValueOfSingleType, SingleType} from '../types';

/**
 * A type conditional for whether the first argument is a subtype of the second.
 */
type subtype<A, B> = A extends B ? true : false;

/**
 * A type conditional for the conjunction of two boolean types.
 */
type and<A extends boolean, B extends boolean> = A extends true
  ? (B extends true ? true : false)
  : false;

/**
 * A type conditional testing if a value matches a `SchemaReference`. It tests whether the schema
 * maps strings to type objects according to that schema, and it tests whether this particular
 * type object is inhabited by the given value.
 *
 * @param value The value to be tested
 * @param type  The name of the type object in the schema
 * @param env   The schema
 */
function valid<T extends keyof E, E extends TSchema, V>(
  value: V,
  type: T,
  env: E
): and<subtype<V, SchemaReference<T, E>>, subtype<E, Record<string, TypeObject<E>>>> {
  throw new Error(String(type) + value + env);
}

function assertTrue(x: true) {
  throw new Error(String(x));
}
function assertFalse(x: false) {
  throw new Error(String(x));
}

function schemaReference<k extends keyof E, E extends TSchema>(
  type: k,
  env: E
): SchemaReference<k, E> {
  throw new Error(String(type) + env);
}
function valueOfType<t extends SingleType>(type: t): ValueOfSingleType<t> {
  throw new Error(String(type));
}

function subtypeOf<A, B>(sub: A, sup: B): subtype<A, B> {
  throw new Error(String(sub) + sup);
}

function typeEq<A, B>(a: A, b: B): and<subtype<A, B>, subtype<B, A>> {
  throw new Error(String(a) + b);
}

const run = (self: any): void => {
  if (self) {
    // we do not actually run anything in this function.
    return;
  }
  const tNum = {type: 'num' as 'num'};
  const tUnit = {type: 'unit' as 'unit'};
  const tText = {type: 'text' as 'text'};
  const tBool = {type: 'bool' as 'bool'};
  const schemaLib = {
    testUndefined: tUnit,
    testNumber: tNum,
    testString: tText,
    testBool: tBool,
    testBlob: {type: 'blob' as 'blob'},
    testMaybeString: {type: 'union' as 'union', first: tUnit, second: tText},
    testObject: {type: 'object' as 'object', properties: {abc: tUnit, def: tNum, ghi: tText}},
    testChoice: {
      type: 'choice' as 'choice',
      options: {abc: {value: tUnit}, def: {value: tNum}, ghi: {value: tText}},
      typeKey: 'type' as 'type',
      valueKey: 'value' as 'value'
    },
    testUnion: {
      type: 'union' as 'union',
      first: tNum,
      second: tText
    },
    testList: {
      type: 'list' as 'list',
      elements: tNum
    }
  };
  const nvr = 1 as never;

  //this is just random sanity checking
  assertTrue(subtypeOf(nvr, 'abc'));

  assertTrue(typeEq(valueOfType(tUnit), undefined as undefined));
  assertTrue(typeEq(schemaReference('testUndefined', schemaLib), undefined as undefined));
  assertTrue(valid(undefined, 'testUndefined', schemaLib));
  assertFalse(valid(null, 'testUndefined', schemaLib));
  assertFalse(valid(123, 'testUndefined', schemaLib));
  assertFalse(valid('abc', 'testUndefined', schemaLib));
  assertFalse(valid(false, 'testUndefined', schemaLib));

  assertTrue(typeEq(valueOfType(tBool), false));
  assertTrue(typeEq(schemaReference('testBool', schemaLib), false));
  assertFalse(valid(undefined, 'testBool', schemaLib));
  assertFalse(valid(null, 'testBool', schemaLib));
  assertFalse(valid(123, 'testBool', schemaLib));
  assertFalse(valid('abc', 'testBool', schemaLib));

  assertTrue(typeEq(valueOfType(tNum), 123));
  assertTrue(typeEq(schemaReference('testNumber', schemaLib), 123 as number));
  assertTrue(valid(123, 'testNumber', schemaLib));
  assertFalse(valid('abc', 'testNumber', schemaLib));
  assertFalse(valid(null, 'testNumber', schemaLib));
  assertFalse(valid(undefined, 'testNumber', schemaLib));
  assertFalse(valid(false, 'testNumber', schemaLib));

  assertTrue(typeEq(valueOfType(tText), 'abc'));
  assertTrue(typeEq(schemaReference('testString', schemaLib), 'abc' as string));
  assertTrue(valid('abc', 'testString', schemaLib));
  assertFalse(valid(123, 'testString', schemaLib));
  assertFalse(valid(null, 'testString', schemaLib));
  assertFalse(valid(undefined, 'testString', schemaLib));
  assertFalse(valid(false, 'testString', schemaLib));

  assertTrue(
    typeEq(
      valueOfType({type: 'union' as 'union', first: {type: 'unit'}, second: {type: 'num'}}),
      123 as undefined | number
    )
  );
  assertTrue(
    typeEq(schemaReference('testMaybeString', schemaLib), undefined as undefined | string)
  );
  assertTrue(valid('abc', 'testMaybeString', schemaLib));
  assertTrue(valid(undefined, 'testMaybeString', schemaLib));
  assertFalse(valid(123, 'testMaybeString', schemaLib));
  assertFalse(valid(null, 'testMaybeString', schemaLib));
  assertFalse(valid(false, 'testMaybeString', schemaLib));

  assertTrue(
    typeEq(schemaReference('testObject', schemaLib), {abc: undefined, def: 123, ghi: 'abc'})
  );
  assertFalse(valid({def: 123, ghi: 'abc'}, 'testObject', schemaLib));

  assertTrue(typeEq(schemaReference('testUnion', schemaLib), 123 as string | number));
  assertTrue(valid(123, 'testUnion', schemaLib));
  assertTrue(valid('abc', 'testUnion', schemaLib));
  assertFalse(valid(undefined, 'testUnion', schemaLib));

  type ExpectedChoice =
    | {type: 'abc'; value: undefined}
    | {type: 'def'; value: number}
    | {type: 'ghi'; value: string};

  assertTrue(
    typeEq(schemaReference('testChoice', schemaLib), {
      type: 'abc',
      value: undefined
    } as ExpectedChoice)
  );
  assertFalse(valid({type: 'abc' as 'abc'}, 'testChoice', schemaLib));

  // test basic recursion
  const stringStack = {
    item: {type: 'text' as 'text'},
    cell: {
      type: 'union' as 'union',
      first: tUnit,
      second: {
        type: 'object' as 'object',
        properties: {
          first: {type: 'ref' as 'ref', to: 'item' as 'item'},
          rest: {type: 'ref' as 'ref', to: 'cell' as 'cell'}
        }
      }
    }
  };

  const testStack = {first: 'abc', rest: {first: 'def', rest: {first: 'ghi', rest: undefined}}};
  assertTrue(valid(testStack, 'cell' as 'cell', stringStack));
  assertTrue(valid({first: 'abc', rest: undefined}, 'cell' as 'cell', stringStack));
  assertTrue(valid(undefined, 'cell' as 'cell', stringStack));
  assertFalse(valid({}, 'cell' as 'cell', stringStack));
  assertFalse(valid({first: ''}, 'cell' as 'cell', stringStack));
  assertFalse(valid({first: 123, rest: null}, 'cell' as 'cell', stringStack));
  assertFalse(valid(null, 'cell' as 'cell', stringStack));

  const badRef = {
    cell: {
      type: 'union' as 'union',
      first: tUnit,
      second: {
        type: 'object' as 'object',
        properties: {
          first: {type: 'ref' as 'ref', to: 'item' as 'item'},
          rest: {type: 'ref' as 'ref', to: 'cell' as 'cell'}
        }
      }
    }
  };

  // Note that `undefined` on this schema is a valid inhabitant of any list type. what is failing
  // here is the assertion that `badRef` is a valid schema **in the first place** before we even get
  // to the question of whether `null` is a valid inhabitant of this schema.
  assertFalse(valid(undefined, 'cell' as 'cell', badRef));

  /* TODO: That assertion can break if a ref is an immediate child of a union, so it is a long-term
  goal to make this not typecheck:
  const infLoop = {
    cell: {
      type: 'union' as 'union',
      first: tUnit,
      second: {type: 'ref' as 'ref', to: 'cell' as 'cell'}
    }
  };
    assertFalse(valid(undefined, 'cell' as 'cell', infLoop)); */

  assertTrue(typeEq(schemaReference('testList', schemaLib), [123]));
  assertFalse(valid(['abc'], 'testList', schemaLib));
  assertFalse(valid(123, 'testList', schemaLib));

  assertTrue(typeEq(schemaReference('testBlob', schemaLib), 123 as any));
};

// this just exists to stop `run` from generating a typescript error about dead code.
test('static compilation of types', () => run(run));
