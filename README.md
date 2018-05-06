# Tasso

_Tasso_ is the name of an ingredient in Cajun cuisine.

It is also, here, a prototype for semi-structured HTTP routers, built with TypeScript and OpenAPI. The basic idea is that you will write something like,

```javascript
myRouter.get('/path/to/resource', {
  doc: 'Resource description',
  queryString: {
    start: {
      doc: 'The date that this query starts from',
      format: 'date',
      required: true
    }
  },
  returns: {
    doc: 'The resource object.',
    format: 'json',
    httpCode: 200,
    schema: {}
  },
  async work(query) {
    // inside this function, VS code will know that the type of `query.start` is a `Date`,
    // having been parsed from the query param `?start=2018-05-05` to the value
    // `new Date("2018-05-05T00:00:00Z")`.

    // Ideally VS Code will also be looking for you to return a JSON response conforming to the
    // above schema.
  })
})
```

This project intends to start with `koa-router` and then possibly branch out to other frameworks like Express.
