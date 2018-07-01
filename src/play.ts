interface IUnit {
  type: 'unit';
  value: SchemaDict;
}
const TUnit: IUnit = { type: 'unit', value: {} };

interface IText {
  type: 'text';
  value: SchemaDict;
}
const TText: IText = { type: 'text', value: {} };

interface IReal {
  type: 'real';
  value: SchemaDict;
}
const TReal: IReal = { type: 'real', value: {} };

interface IProd {
  type: 'prod';
  value: SchemaDict;
}
function TProd<T extends SchemaDict>(dict: T): { type: 'prod'; value: T } {
  return { type: 'prod', value: dict };
}

interface IEnum {
  type: 'enum';
  value: SchemaDict;
}
function TEnum<T extends SchemaDict>(dict: T): { type: 'enum'; value: T } {
  return { type: 'enum', value: dict };
}

type Schema = IUnit | IText | IReal | IProd | IEnum;
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
  throw new Error();
}

function subtypeOf<A, B>(sub: A, sup: B): A extends B ? true : false {
  throw new Error();
}

function valid<T extends Schema, V>(type: T, value: V): V extends ValueOfType<T> ? true : false {
  throw new Error();
}

function assertTrue(x: true) {
  throw new Error();
}
function assertFalse(x: false) {
  throw new Error();
}
type Validate<T extends never> = undefined;

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
