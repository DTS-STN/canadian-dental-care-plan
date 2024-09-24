# Welcome to Remix!

- [Remix Docs](https://remix.run/docs)

## Development

From your terminal:

```sh
npm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `remix build`

- `build/`
- `public/build/`

## Development Guideline

### Service Method Naming Conventions: `find` vs `get` vs `list`

When implementing service methods, it is important to use consistent and descriptive names. Below are the guidelines for choosing between `find`, `get`, and `list` in method names:

#### 1. **`find`**

- **Purpose:** Use `find` when searching or querying for one or more items based on specific criteria. This method may return `null`, `undefined`, or an empty result if no match is found.
- **Usage:** When the existence of the result is **not guaranteed**.
- **Examples:**
  - `findUserByEmail()`: Searches for a user by email and may return `null` if not found.
  - `findOrdersByStatus()`: Queries for orders with a particular status.

#### 2. **`get`**

- **Purpose:** Use `get` when retrieving data that is expected to exist. This method typically retrieves a resource by a known identifier or key. If the resource is not found, it could result in an error or an exception.
- **Usage:** When the result is **guaranteed to exist** (or should exist).
- **Examples:**
  - `getUserById()`: Retrieves a user by their ID and expects that user to exist.
  - `getConfigValue()`: Fetches a configuration value that should be defined.

#### 3. **`list`**

- **Purpose:** Use `list` when returning a collection or list of items. The result will always be a collection (which may be empty), and the method is generally used for retrieving multiple records or all records.
- **Usage:** When returning a **set of items**, typically without any strict filtering.
- **Examples:**
  - `listAllUsers()`: Retrieves a list of all users in the system.
  - `listProductsByCategory()`: Returns products within a given category.

### Summary of Naming Conventions

| Method | Use Case                                                 | Expected Result                                     |
| ------ | -------------------------------------------------------- | --------------------------------------------------- |
| `find` | Searching or querying for an item that **may not exist** | Single item or collection, possibly `null` or empty |
| `get`  | Retrieving an item that is **expected to exist**         | Single item or throws an error if not found         |
| `list` | Retrieving a **collection of items**                     | A collection (empty if no items match)              |

#### Additional Notes

- Methods using `find` should handle the possibility of no results and return `null`, `undefined`, or an empty collection as appropriate.
- Methods using `get` may throw an exception if the resource is not found. Ensure that error handling is in place.
- Methods using `list` should always return a collection (e.g., an array), even if no records match the query.
