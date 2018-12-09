import {
  TSchema,
  SingleType,
  IChoice,
  ValueOfSingleType,
  TypeObject,
  INumber,
  IObject,
  IReference,
  IUnion,
  IList,
  ValueOfType
} from './types';
import {assertImpossible} from './assert-impossible';

export type ValidationOutput<v> =
  | {type: 'ok'; value: v}
  | {type: 'error'; errors: IValidationError[]};

type Path = Array<string | number>;

interface IValidationError {
  /**
   * The path to where the value was spotted in the validated object.
   */
  path: Path;
  /**
   * A message about what went wrong.
   */
  message: string;
  /**
   * The offending value.
   */
  value: any;
  /**
   * The typescript schema object used to validate this value
   */
  typeObject: SingleType;
  /**
   * If the type is a union, records errors specific to either branch that it was trying.
   */
  subErrors?: {first: IValidationError[]; second: IValidationError[]};
}

const hasKey = (x: object, v: string) => Object.prototype.hasOwnProperty.call(x, v);

interface IValidationOptions {
  /**
   * By default a missing property on an object or choice will generate a type error but not
   * necessarily a validation error, as the type that it maps to could validate `undefined`, for
   * example as a `unit` type object or a `maybe` type object. This flag makes the check stricter
   * by aborting validation on a missing key.
   */
  strictMissing?: boolean;

  /**
   * A consequence of defaulting to `strictMissing: false` is that typos in property names of
   * nullable properties become very difficult to debug as the intended property is missing but an
   * extra property is present. To guard against this, by default tasso.validate() checks that a
   * given object does not have any superfluous properties. This flag lets you to skip that check.
   * Again, this would generally show up in the type check but it would be missing if you're
   * talking to some untyped source of data.
   */
  skipPropCheck?: boolean;

  /**
   * By default the `null` value will generate a type error when matching the `unit` type, but if it
   * comes from the untyped world it will be coerced to JavaScript's actual unit type, `undefined`.
   * This is sort of important because JavaScript's unit type perversely has no representation in
   * JSON, and so `null` is sometimes used in JSON to explicitly indicate it, especially if one
   * wants to set `strictMissing: true` while validating JSON input. But if you want tasso to simply
   * forbid nulls altogether, `strictUnit` does that. Note that `maybe(x)` is just syntactic sugar
   * for `union(unit, x)` so any change to `unit` also affects `maybe`.
   */
  strictUnit?: boolean;

  /**
   * By default a number schema will only validate against a JS number, a unit will only validate
   * against a JS null or undefined, a boolean will only validate against a JS boolean. This option
   * allows you to specify which primitive schemas will, if a string is passed as input, JSON-parse
   * it before validation. This is provided mostly with the use case of HTTP query strings in mind;
   * they can _only_ contain strings but sometimes those strings may represent numbers or booleans
   * or units.
   */
  jsonStrings?: Set<'number' | 'unit' | 'text' | 'object' | 'choice' | 'list'>;
}

/**
 * Validate a value against a type in a tasso schema library. This performs a runtime type check and
 * produces a sanitized version of its input or a list of errors describing all the things that need
 * to be corrected for the given input to be correct according to tasso.
 *
 * @param root The root value that you want to check against the schema.
 * @param spec The name of a schema in the type library.
 */
export default function validate<tso extends TypeObject<Env>, Env extends TSchema>(
  root: any,
  spec: tso,
  env: Env,
  options?: IValidationOptions
): ValidationOutput<ValueOfType<tso, Env>> {
  const opts = options || {};
  const strictMissing = opts.strictMissing || false;
  const strictUnit = opts.strictUnit || false;
  const skipPropCheck = opts.skipPropCheck || false;
  const jsonStrings: Set<string> = opts.jsonStrings || new Set();

  /**
   * Validate a JS object against a dict containing a `propName => schema` mapping, which is
   * factored out here because it has to happen for both `object` types and `choice` types.
   * @param value The JS object to be validated.
   * @param props The dict mapping prop names to schemas
   * @param context The schema that this came from, used to enrich error messages.
   * @param path The path to get to the offending item in the main data structure.
   */
  function validateProps<props extends Record<string, TypeObject<Env>>>(
    value: any,
    props: props,
    context: TypeObject<Env>,
    path: Path
  ): ValidationOutput<any> {
    // we save a function to build little validation errors in this context
    const err = (msg: string): IValidationError => {
      const message = context.type + ': ' + msg;
      return {message, path, value, typeObject: context};
    };
    // we validate that the value is indeed an object otherwise nothing else makes sense:
    if (typeof value !== 'object') {
      return {type: 'error', errors: [err(`value is not a JS object; it is a ${typeof value}`)]};
    }
    // We return an `any` that has been sanitized, or a list of errors in validation.
    const out = Object.create(null) as any;
    const errors = [] as IValidationError[];
    for (const prop of Object.keys(props)) {
      if (strictMissing && !hasKey(value, prop)) {
        errors.push(
          err(
            `Property ${JSON.stringify(
              prop
            )} is not present in the value and strict missing-checks are on.`
          )
        );
        // we do not stop at returning just this error, as other properties might also be
        // missing/invalid, but we do skip the rest of validation for this property.
        continue;
      }
      const valid = validateOne(value[prop], props[prop], path.concat([prop]), []);
      if (valid.type === 'error') {
        // meld those errors into this error dictionary.
        for (const error of valid.errors) {
          errors.push(error);
        }
      } else {
        out[prop] = valid.value;
      }
    }
    // finally we do the strict property checking, looking for properties not present in our schema
    if (!skipPropCheck) {
      // enums have a key which we need to skip.
      const skipTypeKey = context.type === 'choice' ? context.typeKey : undefined;
      for (const key of Object.keys(value)) {
        if (key !== skipTypeKey && !hasKey(props, key)) {
          errors.push(err(`extra key ${JSON.stringify(key)} seen here but not in the schema.`));
        }
      }
    }
    return errors.length ? {type: 'error', errors} : {type: 'ok', value: out};
  }
  function validateMany<t extends TypeObject<Env>>(
    baseAccumulator: any,
    keys: string[] | number[],
    value: any,
    typeObject: t,
    path: Path
  ): ValidationOutput<any> {
    const out = baseAccumulator;
    const errors = [] as IValidationError[];
    for (const key of keys) {
      const item = value[key];
      const v = validateOne(item, typeObject, path.concat([key]), []);
      if (v.type === 'error') {
        for (const error of v.errors) {
          errors.push(error);
        }
      } else {
        out.push(v.value);
      }
    }
    if (errors.length) {
      return {type: 'error', errors};
    }
    return {type: 'ok', value: out as any};
  }
  function validateOne<t extends TypeObject<Env>>(
    value: any,
    typeObject: t,
    path: Path,
    refCycle: Array<keyof Env>
  ): ValidationOutput<ValueOfSingleType<t>> {
    // convenience method for emitting a single validation error.
    const singleErr = (msg: string): ValidationOutput<ValueOfSingleType<t>> => {
      const message = typeObject.type + ': ' + msg;
      return {type: 'error', errors: [{value, message, typeObject, path}]};
    };
    if (jsonStrings.has(typeObject.type) && typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch (err) {
        return singleErr('Could not JSON parse value: ' + err.message);
      }
    }
    switch (typeObject.type) {
      case 'unit':
        if (value === null) {
          if (strictUnit) {
            return singleErr('under strictUnit validation, null does not match the unit type');
          }
        } else if (typeof value !== 'undefined') {
          return singleErr(`value is of type ${typeof value}, not the unit type undefined.`);
        }
        return {type: 'ok', value: undefined as any};
      case 'text': {
        if (typeof value !== 'string') {
          return singleErr('value is not a string.');
        }
        return {type: 'ok', value: value as any};
      }
      case 'number': {
        // we might at some point expose a flag allowing Infinity and NaN here... but anyway this
        // expression also tests the `typeof` according to MDN so we should be good.
        if (!Number.isFinite(value)) {
          return singleErr(`value is not a number`);
        }
        if ((typeObject as INumber).integer && value % 1 !== 0) {
          return singleErr(`value is not an integer`);
        }
        return {type: 'ok', value};
      }
      case 'choice': {
        // to validate a choice type we need to ensure that the typeKey and valueKey exist on the
        // output, that the string mapped to by the type
        const {typeKey, options} = typeObject as IChoice<Env>;
        if (
          typeof value !== 'object' ||
          !hasKey(value, typeKey) ||
          typeof value[typeKey] !== 'string'
        ) {
          return singleErr(`value is not a JS object with a string property '${typeKey}'`);
        }
        const candidateType = value[typeKey];
        if (typeof candidateType !== 'string' || !hasKey(options, candidateType)) {
          return singleErr(
            `value specifies type as ${JSON.stringify(
              candidateType
            )} but that is not one of the allowed types`
          );
        }
        const out = validateProps(value, options[candidateType], typeObject, path);
        if (out.type === 'ok') {
          // the sanitized props will be missing the type key as stated, so add it.
          out.value[typeKey] = candidateType;
        }
        return out;
      }
      case 'object':
        return validateProps(value, (typeObject as IObject<Env>).meta, typeObject, path);
      case 'list': {
        if (!(value instanceof Array)) {
          return singleErr('value is not an array');
        }
        const {elements} = typeObject as IList<Env>;
        return validateMany([], Array(value.length).map((_, i) => i), value, elements, path);
      }
      case 'dict': {
        if (typeof value !== 'object') {
          return singleErr('value is not an object');
        }
        const {elements} = typeObject as IList<Env>;
        return validateMany(Object.create(null), Object.keys(value), value, elements, path);
      }
      case 'ref': {
        const ref = (typeObject as IReference<Env>).to;
        if (refCycle.indexOf(ref) !== -1) {
          return singleErr(
            `value witnesses a reference cycle in the given schema: ${refCycle.join(
              ' -> '
            )} -> ${ref}`
          );
        }
        // the following `as any` is needed to stop an excessive stack depth error...
        return validateOne(value, env[ref], path, refCycle.concat([ref])) as any;
      }
      case 'union': {
        const {first, second} = typeObject as IUnion<Env>;
        const tryFirst = validateOne(value, first, path, refCycle);
        if (tryFirst.type !== 'error') {
          return tryFirst as any;
        }
        const trySecond = validateOne(value, second, path, refCycle);
        if (trySecond.type !== 'error') {
          return trySecond as any;
        }
        return {
          type: 'error',
          errors: [
            {
              value,
              typeObject,
              path,
              message:
                'union: could not match this against either the first or second type in the union',
              subErrors: {first: tryFirst.errors, second: trySecond.errors}
            }
          ]
        };
      }
      default:
        return assertImpossible(typeObject.type);
    }
  }
  return validateOne(root, spec, [], []) as any;
}
