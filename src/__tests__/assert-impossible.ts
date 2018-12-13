import {assertImpossible} from '../assert-impossible';

// yeah Jest got cranky about this not being tested.

test('assertImpossible throws TypeError', () => {
  expect(() => {
    assertImpossible('this should always throw' as never);
  }).toThrow(TypeError);
});
