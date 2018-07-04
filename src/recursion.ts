type PreList<x, f> = null | { first: x; rest: f };

// The following works with () => List<x>, but not List<x>
type List<x> = PreList<x, () => List<x>>;

// I see no way to accept a higher-order type parameter?

function foldr<x, y>(acc: y, list: List<x>, reduce: (el: x, acc: y) => y): y {
  return list === null ? acc : reduce(list.first, foldr(acc, list.rest(), reduce));
}
function enumFromTo(x: number, y: number): List<number> {
  return x > y ? null : { first: x, rest: () => enumFromTo(x + 1, y) };
}

function fact(n: number): number {
  return foldr(1, enumFromTo(1, n), (x, y) => x * y);
}

console.log(fact(10));
