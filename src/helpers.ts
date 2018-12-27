import {TypeObject, TSchema, TypeProps} from './types';

const refCache = new Map<string, {type: 'ref'; to: any}>();

/**
 * A schema reference. Within a schema of type objects, a reference to another TSO in the schema
 * allows de-duplication and the potential for defining self-referential data structures.
 * @param to - the string that you are referencing.
 */
export function ref<t extends string>(to: t): {type: 'ref'; to: t} {
  const candidate = refCache.get(to);
  if (candidate) {
    return candidate;
  }
  const out = {type: 'ref' as 'ref', to};
  refCache.set(to, out);
  return out;
}

/**
 * The TSO for the boolean type.
 */
export const bool = {type: 'bool' as 'bool'};

/**
 * The TSO for the unit type.
 */
export const unit = {type: 'unit' as 'unit'};

/**
 * The TSO for the number type.
 */
export const num = {type: 'num' as 'num', integer: false};

/**
 * The TSO for a num that validates as an integer.
 */
export const int = {type: 'num' as 'num', integer: true};

/**
 * The TSO for the text type.
 */
export const text = {type: 'text' as 'text'};

/**
 * The TSO for the blob type -- validates everything as `any`.
 */
export const blob = {type: 'blob' as 'blob'};

/**
 * The TSO for records/product-types: you give this a dict mapping property names to TSOs, and it
 * will produce an object type for that property mapping.
 */
export function object<Env extends TSchema, props extends TypeProps<Env>>(
  properties: props
): {type: 'object'; properties: props} {
  return {type: 'object', properties};
}

/**
 * The TSO for tagged-union/sum-types which `switch()` on some property. You will need to let
 * TypeScript know this property name as well as TypeScript, so a turn-based RPG that wanted to
 * switch on the "target" key for moves but was OK with the classic "type" key for the effects of
 * those moves might use a data structure like,
 *
 * ```ts
 * const targetChoice = chooser('target' as 'target');
 * const moveRefs = refs<'effect' | 'move'>();
 * const moves = {
 *   effect: choice({
 *     damage: { power: num, crit: num, magical: boolean },
 *     sleep: { chance: num }=
 *   }),
 *   move: targetChoice({
 *     one: {
 *       targetIndex: int,
 *       effects: list(moveRefs.effect)
 *     },
 *     all: {
 *       effect: moveRefs.effect
 *     }
 *   })
 *  })
 * ```
 *
 * @param type - the type key that you wish to use, restricted to the TypeScript singleton type you need.
 * @returns a chooser - a function which takes a dict of property schemas for the other properties on the choice.
 */
export function chooser<typeKey extends string>(type: typeKey): Chooser<typeKey> {
  return function(options) {
    return {type: 'choice', options, typeKey: type};
  };
}

/**
 * A choice between options, if the key that one is switching on is `myChoice.type`.
 *
 * @param options A dict mapping types to the other properties on the object that are not the `type` property.
 */
export const choice = chooser('type' as 'type');

/**
 * An untagged union type which could be one of either of two things.
 *
 * @param first The first thing this could be
 * @param second The second thing this could be
 */
export function union<Env extends TSchema, t1 extends TypeObject<Env>, t2 extends TypeObject<Env>>(
  first: t1,
  second: t2
): {type: 'union'; first: t1; second: t2} {
  return {type: 'union', first, second};
}

/**
 * A nullable W, for some wrapped W. This is just syntactic sugar for a `union(unit, W)`, so the
 * word "nullable" should not be taken too literally -- the "null" value here is `undefined`.
 *
 * @param wraps The TSO for the type W that these entities are when they are not undefined.
 */
export function maybe<Env extends TSchema, tso extends TypeObject<Env>>(
  wraps: tso
): {type: 'union'; first: {type: 'unit'}; second: tso} {
  return {type: 'union', first: unit, second: wraps};
}

/**
 * An ordered list of zero or more elements of some specified type.
 *
 * @param elements The TSO for the type of the elements.
 */
export function list<Env extends TSchema, elements extends TypeObject<Env>>(
  elements: elements
): {type: 'list'; elements: elements} {
  return {type: 'list', elements};
}

/**
 * An unordered mapping from zero or more string keys to values of some specified type.
 *
 * @param elements The TSO for the type of the elements.
 */
export function dict<Env extends TSchema, elements extends TypeObject<Env>>(
  elements: elements
): {type: 'dict'; elements: elements} {
  return {type: 'dict', elements};
}

// This is at the bottom of the page because right now it is breaking VS Code's syntax highlighting
export type Chooser<typeKey extends string> = <
  Env extends TSchema,
  opts extends Record<string, TypeProps<Env>>
>(
  options: opts
) => {type: 'choice'; options: opts; typeKey: typeKey};
