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

export interface IEnumerated<Env extends TSchema> {
  type: 'enum';
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

export interface IUnion<Env extends TSchema> {
  type: 'union';
  first: TypeObject<Env>;
  second: TypeObject<Env>;
}

type TypeProps<Env extends TSchema> = Record<string, TypeObject<Env>>;
export type TypeObject<Env extends TSchema> =
  | IUnit
  | INumber
  | IText
  | IObject<Env>
  | IEnumerated<Env>
  | IReference<Env>
  | IList<Env>
  | IUnion<Env>;
export type TSchema = {[k: string]: SingleType};

type TEnumHelper<
  opts extends Record<string, TypeProps<Env>>,
  typeKey extends string,
  Env extends TSchema
> = {[flag in keyof opts]: {[t in typeKey]: flag} & IEvalProps<opts[flag], Env>};

type IEvalProps<T extends TypeProps<Env>, Env extends TSchema> = {[k in keyof T]: IEval<T[k], Env>['result']};

type TEnum<
  T extends Record<string, TypeProps<Env>>,
  typeKey extends string,
  Env extends TSchema
> = TEnumHelper<T, typeKey, Env>[keyof T];

// the 'result' key is needed to stop TypeScript from complaining, totally legitimately, about the circular references
// that will ensue if we do this.
export type SchemaReference<k extends keyof Env, Env extends TSchema> = IEval<
  Env[k],
  Env
>['result'];

// export type TypeObject<Env extends TSchema> = INoArgs | IText | IObject<Env> | IEnumerated<Env> | IReference<Env>
type IEval<tso extends TypeObject<Env>, Env extends TSchema> = tso extends IReference<Env>
  ? {result: SchemaReference<tso['to'], Env>}
  : tso extends IEnumerated<Env>
  ? {result: TEnum<tso['options'], tso['typeKey'], Env>}
  : tso extends IObject<Env>
  ? {result: IEvalProps<tso['meta'], Env>}
  : tso extends IText
  ? {result: string}
  : tso extends IUnit
  ? {result: undefined}
  : tso extends INumber
  ? {result: number}
  : tso extends IList<Env>
  ? {result: Array<IEval<tso['elements'], Env>['result']>}
  : tso extends IUnion<Env>
  ? {result: IEval<tso['first'], Env>['result'] | IEval<tso['second'], Env>['result'] }
  : never;

export type SingleType = TypeObject<TSchema>

export type ValueOfType<v extends SingleType> = SchemaReference<'self', {self: v}>