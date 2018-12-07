interface IMapNoArgs {
  integer: number;
  number: number;
  unit: undefined;
}

interface INoArgs {
  type: keyof IMapNoArgs;
}

interface IText {
  type: 'text';
  regex?: RegExp;
  minLength?: number;
  maxLength?: number;
}

interface IMaybe<Env extends TSchema> {
  type: 'maybe';
  meta: TypeObject<Env>;
}

interface IObject<Env extends TSchema> {
  type: 'object';
  meta: TypeProps<Env>;
}

interface IEnumerated<Env extends TSchema> {
  type: 'enum';
  options: Record<string, TypeProps<Env>>;
  typeKey: string;
}

interface IReference<Env extends TSchema> {
  type: 'ref';
  to: keyof Env;
}

interface IList<Env extends TSchema> {
  type: 'list';
  elements: TypeObject<Env>;
}

interface IUnion<Env extends TSchema> {
  type: 'union';
  first: TypeObject<Env>;
  second: TypeObject<Env>;
}

type TypeProps<Env extends TSchema> = Record<string, TypeObject<Env>>;
export type TypeObject<Env extends TSchema> =
  | INoArgs
  | IText
  | IMaybe<Env>
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
  : tso extends IMaybe<Env>
  ? {result: null | IEval<tso['meta'], Env>['result']}
  : tso extends IText
  ? {result: string}
  : tso extends INoArgs
  ? {result: IMapNoArgs[tso['type']]}
  : tso extends IList<Env>
  ? {result: Array<IEval<tso['elements'], Env>['result']>}
  : tso extends IUnion<Env>
  ? {result: IEval<tso['first'], Env>['result'] | IEval<tso['second'], Env>['result'] }
  : never;

export type SingleType = TypeObject<TSchema>

export type ValueOfType<v extends SingleType> = SchemaReference<'self', {self: v}>