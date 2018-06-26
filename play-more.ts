// This is a version of play.ts which does something a little more Haskell-like, forcing you to place the sum types
// at the outermost when defining. This makes the implementation of sum types much more "obvious" and inspectable,
// allowing us to, say, JSON-encode them, since we do not need them to be existentially typed. However what I am
// not clear on is if you want to say `data NonEmptyStream x = NonEmpty x (Maybe (NonEmptyStream x))` for example,
// trying to put the one structured data type `Maybe` into the other structured data type `NonEmptyStream`.

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

type Schema = IUnit | IText | IReal | IItem;
type SchemaDict = { [k: string]: Schema };

interface IBaseTypes<T extends SchemaDict> {
  unit: undefined;
  text: string;
  real: number;
  item: { [k in keyof T]: IValidated<T[k]> };
}
type IValidated<T extends Schema> = IBaseTypes<T['meta']>[T['type']];

interface IValueOf<T extends SchemaDict, K extends keyof T> {
  type: K;
  value: IValidated<T[K]>;
}

function assertValid<T extends Schema>(type: T, validated: IValidated<T>) {
  throw new Error();
}

function assertValidSum<T extends SchemaDict, K extends keyof T>(
  type: T,
  validated: IValueOf<T, K>
) {
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

const testEnum = {
  abc: TReal,
  def: TText
};
assertValidSum(testEnum, { type: 'abc', value: 123 });
assertValidSum(testEnum, { type: 'def', value: '456' });

// compile-time error:
// assertValidSum(testEnum, { type: 'def', value: 456});
