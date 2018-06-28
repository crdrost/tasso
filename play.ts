interface IUnit {
  type: 'unit';
  meta?: undefined;
}
const TUnit: IUnit = { type: 'unit' };
interface IText {
  type: 'text';
  meta?: undefined;
}
const TText: IText = { type: 'text' };
interface IReal {
  type: 'real';
  meta?: undefined;
}
const TReal: IReal = { type: 'real' };
interface IItem {
  type: 'item';
  meta: SchemaDict;
}
function TItem<T extends SchemaDict>(dict: T): { type: 'item'; meta: T } {
  return { type: 'item', meta: dict };
}
interface IEnum {
  type: 'enum';
  meta: SchemaDict;
}
function TEnum<T extends SchemaDict>(dict: T): { type: 'enum'; meta: T } {
  return { type: 'enum', meta: dict };
}

type Schema = IUnit | IText | IReal | IItem | IEnum;
type SchemaDict = { [k: string]: Schema };

type EnumHelper<T extends SchemaDict> = { [k in keyof T]: { type: k; meta: IValidated<T[k]> } };
type Enum<T extends SchemaDict> = EnumHelper<T>[keyof T];

interface IBaseTypes<T extends SchemaDict> {
  unit: undefined;
  text: string;
  real: number;
  item: { [k in keyof T]: IValidated<T[k]> };
  enum: Enum<T>;
}
type IValidated<T extends Schema> = IBaseTypes<T['meta']>[T['type']];
function assertValid<T extends Schema>(type: T, validated: IValidated<T>) {
  throw new Error();
}

assertValid(TReal, 123);
assertValid(TText, 'abc');
assertValid(
  TItem({
    abc: TReal,
    def: TText
  }),
  { abc: 123, def: '456' }
);
const testEnum = TEnum({
  abc: TReal,
  def: TText
});
assertValid(testEnum, { type: 'abc', meta: 123 });
assertValid(testEnum, { type: 'def', meta: '456' });
