export interface IUnit {
  type: 'unit';
}

export interface INumber {
  type: 'number';
  integer?: boolean;
}

export interface IText {
  type: 'text';
}

export interface IObject<Env extends TSchema> {
  type: 'object';
  meta: TypeProps<Env>;
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
  [k in keyof T]: ValueOfType<T[k], Env>['result']
};

type TEvalOptions<
  options extends Record<string, TypeProps<Env>>,
  typeKey extends string,
  Env extends TSchema
> = TChoiceHelper<options, typeKey, Env>[keyof options];

// the 'result' key is needed to stop TypeScript from complaining, totally legitimately, about the circular references
// that will ensue if we do this.
export type SchemaReference<k extends keyof Env, Env extends TSchema> = ValueOfType<
  Env[k],
  Env
>['result'];

// export type TypeObject<Env extends TSchema> = INoArgs | IText | IObject<Env> | IChoice<Env> | IReference<Env>
export type ValueOfType<tso extends TypeObject<Env>, Env extends TSchema> = tso extends IReference<
  Env
>
  ? {result: SchemaReference<tso['to'], Env>}
  : tso extends IChoice<Env>
  ? {result: TEvalOptions<tso['options'], tso['typeKey'], Env>}
  : tso extends IObject<Env>
  ? {result: ValueOfTypeProps<tso['meta'], Env>}
  : tso extends IText
  ? {result: string}
  : tso extends IUnit
  ? {result: undefined}
  : tso extends INumber
  ? {result: number}
  : tso extends IList<Env>
  ? {result: Array<ValueOfType<tso['elements'], Env>['result']>}
  : tso extends IDict<Env>
  ? {result: Record<string, ValueOfType<tso['elements'], Env>['result']>}
  : tso extends IUnion<Env>
  ? {result: ValueOfType<tso['first'], Env>['result'] | ValueOfType<tso['second'], Env>['result']}
  : never;

export type SingleType = TypeObject<TSchema>;

export type ValueOfSingleType<v extends SingleType> = SchemaReference<'self', {self: v}>;
