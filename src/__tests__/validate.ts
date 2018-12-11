import validate from '../validate';

// test basic recursion
test('validate basic recursion', () => {
  const stringStack = {
    item: {type: 'text' as 'text'},
    cell: {
      type: 'union' as 'union',
      first: {type: 'unit' as 'unit'},
      second: {
        type: 'object' as 'object',
        properties: {
          first: {type: 'ref' as 'ref', to: 'item' as 'item'},
          rest: {type: 'ref' as 'ref', to: 'cell' as 'cell'}
        }
      }
    }
  };

  const testVal: any = {first: 'abc', rest: {first: 'def', rest: {first: 'ghi', rest: null}}};
  const testStack = validate(testVal, 'cell', stringStack);

  expect(testStack.type).toBe('ok');
  if (testStack.type === 'ok') {
    expect(testStack.value).toEqual({
      first: 'abc',
      rest: {first: 'def', rest: {first: 'ghi', rest: undefined}}
    });
  }
});
