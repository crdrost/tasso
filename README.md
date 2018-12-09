# Tasso

_Tasso_ is the name of an ingredient in Cajun cuisine.

It is also, here, a prototype for **runtime type objects** in TypeScript. It seemed like a better
name than "TSO", TypeScript Schema Objects, or whatever.

Of course, like all TypeScript that's resident at runtime, you can also use these schema objects to
validate JavaScript from JavaScript. But a key feature is that you don't have to repeat yourself
when you're writing the TypeScript types, which come for free from this library.

## Wait, what?

So for example imagine that you write some HTTP API like,

```ts
router.get('/path/to/thing', {
  queryParams: {
    id: {
      doc: 'The ID of the thing',
      type: 'integer'
    }
  },
  async handler(query) {
    // some logic
  }
});
```

Using `tasso` it is possible to ensure that inside this handler, TypeScript (and thus VS Code) can
infer that the `query` argument has the shape `{id: integer}` without any further annotation from
you. This is possible because the config object for the route looks like,

```ts
interface IRouteConfigGet<Q extends QueryParams> {
  queryParams: Q;
  handler: (query: QueryValues<Q>) => Promise<HttpResponse>;
}
```

so TypeScript gets direct information from the `queryParams` key that you have provided, and in turn
it wants to unify that information into the handler function. The `queryParams` key defines a
**schema object**, a runtime value that TypeScript can use to determine the type of the `query`.

## The manifesto

Now that we have TypeScript we have to repeat ourselves several times if we do not want bugs:

- We write types in TypeScript, so VS Code can yell at us when our code makes no sense.
- We rewrite those types in JSON Schema or so, because we talk to JavaScript and JavaScript is a
  monotyped wonderland where everything (e.g. `JSON.parse`) comes to us as `any`-typed.
- We rewrite those types for our documentation generator to consume, when it doesn't handle JSON
  Schema directly.
- We rewrite those types when we consume the data structure, because types are isomorphic to the
  control structures that consume them.

This library takes the following stand:

- For some of your types (the ones that cross the JS/TS barrier) the type can be encoded in a
  runtime-present "typescript schema object" `tso` with a hyper-specific type. This is a library of
  related types that can reference each other. Convenience functions are provided to construct it,
  which allow you to avoid writing `"object" as "object"` and such over and over again.
- Given that schema's type, `typeof tso`, there is a TypeScript derivation, say,
  `ValueOfType<k extends TypeObject<T>, T extends Schema>`, for the values which inhabit that type.
- There is a validation function from a value of type `any` to the derived value-type.
- The schemas can be threaded through with consistent metadata. I am not sure that this is
  absolutely essential but I mean it's a nice-to-have.
- There should also be a program which, given a schema in a schema library, scaffolds out the
  control structure that consumes it.
- There should be a metaschema. That is, it should be possible to use this library to determine if a
  schema is valid.

The cost is just that you must construct your types with the conventions of this library; in
particular that means that sum-types must discriminate based on a fixed key pointing at a string. In
addition there are many things that we'd like but cannot offer yet, for example I'd like this to
support ADTs or maybe even GADTs but we'd need a good story on how to handle type variables.

# How to model data the `tasso` way

Tasso is strongly based on the idea that there is an isomorphism between the data structures you use
and the control structures that consume them. Here are the basic control structures that tasso
targets and the data structures that they correspond to:

- `switch (obj[typeKey])` statements: entities that tasso calls `choice`s and type theorists call
  “tagged unions” or “sum types.” Tasso, like the control structure, requires the `typeKey` to be
  constant for all such objects, so if you want to use TypeScript's `|` operator more generally you
  will need to use union schemas below.
- `for (const item of obj)` loops: entities that tasso calls `list`s and JS/TypeScript calls
  “arrays.” As with TypeScript all of the elements must be of one consistent type, though it may
  include unions.
- `for (const key of Object.keys(obj))` loops: entities that tasso calls `dict`s and stores as
  JavaScript objects; TypeScript calls these “records” in at least one interface. The main feature
  is iteration through a key-value pair listing where the keys are not repeated. JavaScript has a
  dedicated `Map` class which does the same, so that's another word for them.
- `if(check(obj))` statements: entities that tasso calls `union`s after the term for `|` in
  TypeScript. Of course you can do deeper things with business logic with an `if` statement; here
  `check()` is being restricted to only those functions which check the shape of the data to match a
  given schema.
- `obj[property]` accessors: entities that tasso calls `object`s, type theorists call “product
  types” or “records.” These are stored as JS objects with fixed keys that each have some schema for
  the things they access.

In addition to these we have several primitives: a `unit` type (what JavaScript calls `undefined`),
both `number` and `integer` types, a `text` type which can be specified with an optional regex for
validation, and a `ref` to another type object in the schema.

There are some control structures which tasso does not do directly; for example you might have a
TypeScript `Array<{key?: string, rowValues: IRow}>` type where you are expecting the keys to mostly
be distinct but you consume this via the `find` and `filter` control structures plus the not-null
type assertion `!`,

```ts
const totalRow = queryResponse.find(x => x.key === undefined);
for (const row of queryResponse.filter(x => x.key !== undefined)) {
  myTable.addRow('dataClass', row.key!, row.rowValues);
}
myTable.addRow('totalClass', 'Total', totalRow!.rowValues);
```

Tasso will let you describe that TypeScript type, but since that control structure is not natural to
Tasso you may instead find yourself wishfully assuming that the `totalRow` is guaranteed to exist
and the keys are guaranteed to be unique or so, in other words your natural control structure in
tasso's terms is,

```ts
const {totalRow, breakdown} = queryResponse;
for (const key of Object.keys(breakdown)) {
  myTable.addRow('dataClass', key, breakdown[key]);
}
myTable.addRow('totalClass', 'Total', totalRow);
```

and thus Tasso "wants" to describe this `queryResponse` with an object schema, as

```ts
const refs = tasso.refs<'IRow'>();
const queryResponseTSO = tasso.object({
  totalRow: refs.IRow,
  breakdown: tasso.dict(refs.IRow)
}
```

# License and Contributing

This is licensed under the Mozilla Public License v2. It's kind of like a very polite GPL. This code
can coexist alongside proprietary code without open-sourcing it, but any edits to the constituent
files of this repository also become open-source, and that probably includes any files that you
paste my source code into. But it always operates at a file-boundary, so you can use that to stay
sane. You can read the full details in `LICENSE`.

Your issues and feature requests and code contributions are 100% welcome as long as any new files
are also under the MPLv2.
