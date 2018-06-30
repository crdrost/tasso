interface IUnit {
  type: 'unit';
  value: undefined;
}
const TUnit: IUnit = { type: 'unit', value: undefined };

interface IText {
  type: 'text';
  value: undefined;
}
const TText: IText = { type: 'text', value: undefined };

interface IReal {
  type: 'real';
  value: undefined;
}
const TReal: IReal = { type: 'real', value: undefined };

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

assertTrue(valid(TReal, 123));
assertTrue(valid(TText, 'abc'));
assertFalse(valid(TReal, 'abc'));
assertFalse(valid(TText, 123));
const testProduct = TProd({
  abc: TReal,
  def: TText
});
assertTrue(valid(testProduct, { abc: 123, def: '456' }));
assertFalse(valid(testProduct, { abc: '123', def: 456 }));

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
