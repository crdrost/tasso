# Tasso

_Tasso_ is the name of an ingredient in Cajun cuisine.

It is also, here, a prototype for **runtime type objects** in TypeScript. It seemed like a better
name than "TSO", TypeScript Schema Objects, or whatever.

## Wait, what?

So for example imagine that you write some HTTP API like,

```js
router.get('/path/to/thing', {
  queryParams: {
    id: {
      doc: 'The ID of the thing',
      type: 'integer'
    }
  },
  async handler(query) {
    // imagine that inside here TS is smart enough to infer that `query` has the
    // shape `{id: number}` and it has been runtime-validated to be an integer.
  }
});
```

That `handler()` trick is possible because the config object for the route looks like,

```ts
interface IRouteConfigGet<Q extends QueryParams> {
  queryParams: Q;
  handler: (query: ValuesOfTypes<Q>) => Promise<HttpResponse>;
}
```

so TypeScript wants to unify the information that it gets from `queryParams` into the handler
function.

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
  `ValueOfType<k extends keyof T, T extends Schema>`, for the values which inhabit that type.
- There is a validation function from a value of type `any` to the derived value-type.
- The schemas can be threaded through with consistent metadata. I am not sure that this is
  absolutely essential but I mean it's a nice-to-have.
- There should also be a program which, given a schema in a schema library, scaffolds out the
  control structure that consumes it.
- There should be a metaschema. That is, it should be possible to use this library to determine if a
  schema is valid.

The cost is just that you must construct your types with the conventions of this library; in
particular that means that sum-types must enumerate based on a `type` key pointing at a string. In
addition there are many things that we'd like but cannot offer yet:

- I'd like this to support ADTs or maybe even GADTs but we'd need a good story on how to handle type
  variables.
- I'm not actually sure that it's out of the question to make sum types enumerate based on a
  different key if you are hyper-specific?

# License and Contributing

This is licensed under the Mozilla Public License v2. It's kind of like a very polite GPL. This code
can coexist alongside proprietary code without open-sourcing it, but any edits to the constituent
files of this repository also become open-source, and that probably includes any files that you
paste my source code into. But it always operates at a file-boundary, so you can use that to stay
sane. You can read the full details in `LICENSE`.

Your issues and feature requests and code contributions are 100% welcome as long as any new files are
also under the MPLv2.