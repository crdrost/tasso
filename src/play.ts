const TUnit = { type: 'unit' as 'unit', value: {} };

const TText = { type: 'text' as 'text', value: {} };

const TReal = { type: 'real' as 'real', value: {} };

function TProd<T extends SchemaDict>(dict: T) {
  return { type: 'prod' as 'prod', value: dict };
}

function TEnum<T extends SchemaDict>(dict: T) {
  return { type: 'enum' as 'enum', value: dict };
}

interface ISchema {
  type: keyof IBaseTypes<any>;
  value: SchemaDict;
}

type Schema = ISchema;
type SchemaDict = { [k: string]: Schema };

type EnumHelper<T extends SchemaDict> = { [k in keyof T]: { type: k; value: ValueOfType<T[k]> } };
type Enum<T extends SchemaDict> = EnumHelper<T>[keyof T];

interface IBaseTypes<T extends SchemaDict> {
  unit: undefined;
  text: string;
  real: number;
  prod: { [k in keyof T]: ValueOfType<T[k]> };
  enum: Enum<T>;
}
type ValueOfType<T extends Schema> = IBaseTypes<T['value']>[T['type']];

function valueOfType<T extends Schema>(type: T): ValueOfType<T> {
  throw new Error(String(type));
}

type subtype<A, B> = A extends B ? true : false;

function subtypeOf<A, B>(sub: A, sup: B): subtype<A, B> {
  throw new Error(String(sub) + sup);
}

function valid<T extends Schema, V>(type: T, value: V): V extends ValueOfType<T> ? true : false {
  throw new Error(String(type) + value);
}

type and<A extends boolean, B extends boolean> = A extends true
  ? (B extends true ? true : false)
  : false;

function typeEq<A, B>(a: A, b: B): and<subtype<A, B>, subtype<B, A>> {
  throw new Error(String(a) + b);
}

function assertTrue(x: true) {
  throw new Error(String(x));
}
function assertFalse(x: false) {
  throw new Error(String(x));
}

assertTrue(subtypeOf('abc' as 'abc', 'abc' as string));
assertTrue(subtypeOf(undefined, undefined));
assertFalse(subtypeOf('abc', {} as object));
assertFalse(subtypeOf(null as null, 123));
assertFalse(subtypeOf(null as null, 123));

assertTrue(valid(TUnit, undefined as undefined));
assertFalse(valid(TUnit, null as null));
assertFalse(valid(TUnit, 123));
assertFalse(valid(TUnit, 'abc'));

assertTrue(valid(TReal, 123));
assertFalse(valid(TReal, 'abc'));
assertFalse(valid(TReal, null as null));
assertFalse(valid(TReal, undefined as undefined));

assertTrue(valid(TText, 'abc'));
assertFalse(valid(TText, 123));
assertFalse(valid(TText, null as null));
assertFalse(valid(TText, undefined as undefined));

const testProduct = TProd({
  abc: TReal,
  def: TText
});
assertTrue(valid(testProduct, { abc: 123, def: '456' }));
assertFalse(valid(testProduct, { abc: '123', def: 456 }));
assertFalse(valid(testProduct, null as null));
assertFalse(valid(testProduct, undefined as undefined));

const testEnum = TEnum({
  abc: TReal,
  def: TText
});

// The valid() function does not directly express V extends ValueOfType<T>, so it infers 'abc' (the
// value) to have type `string` rather than type `'abc'`, then it gets these values incorrect.
assertTrue(valid(testEnum, { type: 'abc' as 'abc', value: 123 }));
assertTrue(valid(testEnum, { type: 'def' as 'def', value: '456' }));
assertFalse(valid(testEnum, { type: 'abc' as 'abc', value: '123' }));
assertFalse(valid(testEnum, { type: 'def' as 'def', value: 456 }));

type KeySubtract<Q, R extends Q> = Q extends R ? never : Q;

type ObjectSubtractKey<O, K extends keyof O> = { [key in KeySubtract<keyof O, K>]: O[key] };

type TestKeySubtract = ObjectSubtractKey<{ abc: number; def: string; ghi: null }, 'abc'>;
assertTrue(typeEq({} as TestKeySubtract, { def: 'string', ghi: null }));
