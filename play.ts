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
function assertValid<T extends Schema>(type: T, validated: ValueOfType<T>) {
  throw new Error();
}

assertValid(TReal, 123);
assertValid(TText, 'abc');
assertValid(
  TProd({
    abc: TReal,
    def: TText
  }),
  { abc: 123, def: '456' }
);
const testEnum = TEnum({
  abc: TReal,
  def: TText
});
assertValid(testEnum, { type: 'abc', value: 123 });
assertValid(testEnum, { type: 'def', value: '456' });
