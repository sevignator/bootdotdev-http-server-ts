# HTTP server with TypeScript

## Set up

1. Create a `.env.` file in the project's root directory. Make sure that it includes the following keys:

    - `DB_URL`: The connection string to your PostgreSQL database.
    - `PLATFORM`: Either set to `"dev"` or `"prod"`.
    - `JWT_SECRET`: A secret string used for generating and verifying JWT tokens.
    - `POLKA_KEY`: An API key for the pseudo third-party service (use `"f271c81ff7084ee5b99a5091b42d486e"`).

## Technology stack

- [Drizzle](https://orm.drizzle.team/)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
