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
  meta: TDict<Env>;
}

interface IEnumerated<Env extends TSchema> {
  type: 'enum';
  meta: TDict<Env>;
  typeKey: string;
  valueKey: string;
}

interface IReference<Env extends TSchema> {
  type: 'ref';
  to: keyof Env;
}
type TDict<Env extends TSchema> = {[k: string]: TypeObject<Env>};
export type TypeObject<Env extends TSchema> =
  | INoArgs
  | IText
  | IMaybe<Env>
  | IObject<Env>
  | IEnumerated<Env>
  | IReference<Env>;
export type TSchema = {[k: string]: SingleType};

type KVPair<key extends string, value> = {[k in key]: value};

type TEnumHelper<
  T extends TDict<Env>,
  typeKey extends string,
  valueKey extends string,
  Env extends TSchema
> = {[k in keyof T]: KVPair<typeKey, k> & KVPair<valueKey, IEval<T[k], Env>['result']>};

type IEvalObject<T extends TDict<Env>, Env extends TSchema> = {[k in keyof T]: IEval<T[k], Env>['result']};

type TEnum<
  T extends TDict<Env>,
  typeKey extends string,
  valueKey extends string,
  Env extends TSchema
> = TEnumHelper<T, typeKey, valueKey, Env>[keyof T];

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
  ? {result: TEnum<tso['meta'], tso['typeKey'], tso['valueKey'], Env>}
  : tso extends IObject<Env>
  ? {result: IEvalObject<tso['meta'], Env>}
  : tso extends IMaybe<Env>
  ? {result: null | IEval<tso['meta'], Env>['result']}
  : tso extends IText
  ? {result: string}
  : tso extends INoArgs
  ? {result: IMapNoArgs[tso['type']]}
  : never;

export type SingleType = TypeObject<TSchema>

export type ValueOfType<v extends SingleType> = SchemaReference<'self', {self: v}>