interface INull {
  type: "null";
  meta?: undefined;
}
const TNull: INull = { type: "null" };
interface IText {
  type: "text";
  meta?: undefined;
}
const TText: IText = { type: "text" };
interface IReal {
  type: "real";
  meta?: undefined;
}
const TReal: IReal = { type: "real" };
interface IItem {
  type: "item";
  meta: SchemaDict;
}
function TItem<T extends SchemaDict>(dict: T): { type: "item"; meta: T } {
  return { type: "item", meta: dict };
}
interface IEnum {
  type: "enum";
  meta: SchemaDict;
}
function TEnum<T extends SchemaDict>(dict: T): { type: "enum"; meta: T } {
  return { type: "enum", meta: dict };
}

type Schema = INull | IText | IReal | IItem | IEnum;
type SchemaDict = { [k: string]: Schema };

interface IBaseTypes<T extends SchemaDict> {
  null: null;
  text: string;
  real: number;
  item: { [k in keyof T]: IValidated<T[k]> };
  enum<z>(handlers: { [k in keyof T]: (i: IValidated<T[k]>) => z }): z;
}
type IValidated<T extends Schema> = IBaseTypes<T["meta"]>[T["type"]];
function assertValid<T extends Schema>(type: T, validated: IValidated<T>) {
  throw new Error();
}

assertValid(TReal, 123);
assertValid(TText, "abc");
assertValid(
  TItem({
    abc: TReal,
    def: TText
  }),
  { abc: 123, def: "456" }
);
const testEnum = TEnum({
  abc: TReal,
  def: TText
});
assertValid(testEnum, ({ abc, def }) => abc(123));
assertValid(testEnum, ({ abc, def }) => def("456"));
