export interface IUnit {
  type: 'unit';
}

export interface IBool {
  type: 'bool';
}

export interface INumber {
  type: 'num';
  integer?: boolean;
}

export interface IText {
  type: 'text';
}

export interface IObject<Env extends TSchema> {
  type: 'object';
  properties: TypeProps<Env>;
}

export interface IChoice<Env extends TSchema> {
  type: 'choice';
  options: Record<string, TypeProps<Env>>;
  typeKey: string;
}

export interface IReference<Env extends TSchema> {
  type: 'ref';
  to: keyof Env;
}

export interface IList<Env extends TSchema> {
  type: 'list';
  elements: TypeObject<Env>;
}

export interface IDict<Env extends TSchema> {
  type: 'dict';
  elements: TypeObject<Env>;
}

export interface IUnion<Env extends TSchema> {
  type: 'union';
  first: TypeObject<Env>;
  second: TypeObject<Env>;
}

export type TypeProps<Env extends TSchema> = Record<string, TypeObject<Env>>;
export type TypeObject<Env extends TSchema> =
  | IUnit
  | IBool
  | INumber
  | IText
  | IObject<Env>
  | IChoice<Env>
  | IReference<Env>
  | IList<Env>
  | IDict<Env>
  | IUnion<Env>;
export type TSchema = {[k: string]: SingleType};

type TChoiceHelper<
  opts extends Record<string, TypeProps<Env>>,
  typeKey extends string,
  Env extends TSchema
> = {[flag in keyof opts]: {[t in typeKey]: flag} & ValueOfTypeProps<opts[flag], Env>};

type ValueOfTypeProps<T extends TypeProps<Env>, Env extends TSchema> = {
  [k in keyof T]: TEval<T[k], Env, never>['result']
};

type TEvalOptions<
  options extends Record<string, TypeProps<Env>>,
  typeKey extends string,
  Env extends TSchema
> = TChoiceHelper<options, typeKey, Env>[keyof options];

// the 'result' key is needed to stop TypeScript from complaining, totally legitimately, about the circular references
// that will ensue if we do this.
export type SchemaReference<k extends keyof e, e extends TSchema> = ValueOfType<e[k], e>;

export type ValueOfType<t extends TypeObject<e>, e extends TSchema> = TEval<t, e, never>['result'];

// We want to propagate `never` up to the final type, and for the most part this just happens.
// Like TypeScript sees {abc: never} and monadically joins that up to be never in the above mapped
// types. But one place where it doesn't happen is in the union operator, where never | x turns out
// to be equal to just x. So we use conditional types to deliberately propagate these nevers.
type Merge<x, y> = x extends never ? never : y extends never ? never : x | y;

// export type TypeObject<Env extends TSchema> = INoArgs | IText | IObject<Env> | IChoice<Env> | IReference<Env>
type TEval<
  tso extends TypeObject<Env>,
  Env extends TSchema,
  x extends keyof Env // exclusions that may not appear in this place to defeat cyclic references.
> = tso extends IChoice<Env>
  ? {result: TEvalOptions<tso['options'], tso['typeKey'], Env>}
  : tso extends IObject<Env>
  ? {result: ValueOfTypeProps<tso['properties'], Env>}
  : tso extends IText
  ? {result: string}
  : tso extends IUnit
  ? {result: undefined}
  : tso extends IBool
  ? {result: boolean}
  : tso extends INumber
  ? {result: number}
  : tso extends IList<Env>
  ? {result: Array<TEval<tso['elements'], Env, x>['result']>}
  : tso extends IDict<Env>
  ? {result: Record<string, TEval<tso['elements'], Env, x>['result']>}
  : tso extends IUnion<Env>
  ? {result: Merge<TEval<tso['first'], Env, x>['result'], TEval<tso['second'], Env, x>['result']>}
  : tso extends IReference<Env>
  ? (tso['to'] extends x ? never : {result: TEval<Env[tso['to']], Env, x | tso['to']>['result']})
  : never;

export type SingleType = TypeObject<TSchema>;

export type ValueOfSingleType<v extends SingleType> = SchemaReference<'self', {self: v}>;
