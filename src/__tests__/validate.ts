import validate, {ValidationOutput} from '../validate';
import * as tasso from '../helpers';

function expectOk<x>(output: ValidationOutput<x>, fn: (x: x) => void): void {
  expect(output.type).toBe('ok');
  if (output.type === 'ok') {
    fn(output.value);
  }
}
function expectErrors(output: ValidationOutput<any>): void {
  expect(output.type).toBe('error');
  if (output.type === 'error') {
    expect(output.errors.length).toBeGreaterThan(0);
  }
}

// test basic recursion
test('validate basic recursion', () => {
  const refs = tasso.refs<'item' | 'cell'>();
  const stringStack = {
    item: tasso.text,
    cell: tasso.maybe(tasso.object({first: refs.item, rest: refs.cell}))
  };
  const testVal = {first: 'abc', rest: {first: 'def', rest: {first: 'ghi', rest: null}}};
  const testStack = validate(testVal, 'cell', stringStack);

  expectOk(testStack, stack =>
    expect(stack).toEqual({
      first: 'abc',
      rest: {first: 'def', rest: {first: 'ghi', rest: undefined}}
    })
  );
}, 1000);

test('unit type accepts undefined and null -- unless strictUnit is set.', () => {
  const valUndefined = (x: undefined): void => expect(x).toBe(void 0);
  expectOk(validate(null, tasso.unit, {}, {}), valUndefined);
  expectOk(validate(undefined, tasso.unit, {}, {}), valUndefined);
  expectErrors(validate(null, tasso.unit, {}, {strictUnit: true}));
  expectErrors(validate(0, tasso.unit, {}));
  expectErrors(validate(false, tasso.unit, {}));
  expectErrors(validate('', tasso.unit, {}));
  expectErrors(validate('null', tasso.unit, {}));
}, 1000);

test('bools - basic functionality', () => {
  expectOk(validate(true, tasso.bool, {}, {}), x => expect(x).toBe(true));
  expectOk(validate(false, tasso.bool, {}, {}), x => expect(x).toBe(false));
  expectErrors(validate(null, tasso.bool, {}, {}));
  expectErrors(validate(0, tasso.bool, {}, {}));
  expectErrors(validate(1, tasso.bool, {}, {}));
  expectErrors(validate('', tasso.bool, {}, {}));
  expectErrors(validate(undefined, tasso.bool, {}, {}));
  expectErrors(validate('true', tasso.bool, {}, {}));
  expectErrors(validate('false', tasso.bool, {}, {}));
}, 1000);

test('texts - basic functionality', () => {
  expectOk(validate(' abc ', tasso.text, {}, {}), x => expect(x).toBe(' abc '));
  expectOk(validate('', tasso.text, {}, {}), x => expect(x).toBe(''));
  expectOk(validate('\udcdc', tasso.text, {}, {}), x => expect(x).toBe('\udcdc'));
  expectErrors(validate(null, tasso.text, {}, {}));
  expectErrors(validate(0, tasso.text, {}, {}));
  expectErrors(validate(1, tasso.text, {}, {}));
  expectErrors(validate(false, tasso.text, {}, {}));
  expectErrors(validate(undefined, tasso.text, {}, {}));
}, 1000);

test('nums - basic functionality', () => {
  expectOk(validate(123, tasso.num, {}, {}), x => expect(x).toBe(123));
  expectOk(validate(-123, tasso.num, {}, {}), x => expect(x).toBe(-123));
  expectOk(validate(0, tasso.num, {}, {}), x => expect(x).toBe(0));
  expectErrors(validate(0 / 0, tasso.num, {}, {}));
  expectErrors(validate(1 / 0, tasso.num, {}, {}));
  expectErrors(validate(-1 / 0, tasso.num, {}, {}));
  expectOk(validate(Math.PI, tasso.num, {}, {}), x => expect(x).toBe(Math.PI));
}, 1000);

test('ints - basic functionality', () => {
  expectOk(validate(-10, tasso.int, {}, {}), x => expect(x).toBe(-10));
  expectErrors(validate(Math.PI, tasso.int, {}, {}));
  expectErrors(validate(0.5, tasso.int, {}, {}));
  const n = (0.09 + 0.01) * 10 * 10; // 9.999999999999998
  expectErrors(validate(n, tasso.int, {}, {}));
}, 1000);

describe('choices - basic functionality', () => {
  const schema = tasso.choice({
    left: {abc: tasso.int, '123': tasso.text},
    right: {abc: tasso.int, def: tasso.text}
  });
  test('left/right: valid left example', () => {
    expectOk(validate({type: 'left', abc: 123, 123: 'abc'}, schema, {}, {}), x =>
      expect(x).toEqual({type: 'left', abc: 123, 123: 'abc'})
    );
  });
  test('left/right: valid right example', () => {
    expectOk(validate({type: 'right', abc: 123, def: '456'}, schema, {}, {}), x =>
      expect(x).toEqual({type: 'right', abc: 123, def: '456'})
    );
  });
  test('left/right: invalid left example', () => {
    expectErrors(validate({type: 'left', abc: 123, def: '456'}, schema, {}, {}));
  });
  test('left/right: invalid right example', () => {
    expectErrors(validate({type: 'right', abc: 123, 123: 'abc'}, schema, {}, {}));
  });
  test('left/right: null, undefined do not validate', () => {
    expectErrors(validate(null, schema, {}, {}));
    expectErrors(validate(undefined, schema, {}, {}));
  });
});

/*
      case 'num': {
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
        return validateProps(value, (typeObject as IObject<Env>).properties, typeObject, path);
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

    */
